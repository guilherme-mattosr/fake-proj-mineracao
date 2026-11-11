import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Scale,
  ShieldCheck,
  MessageSquare,
  FolderOpen,
  BriefcaseBusiness,
} from "lucide-react";
import { useStore, login, transact } from "../store/store";
import { audit, requireThat } from "../domain/actions";
import type { Role, User } from "../domain/types";
import { Field, Form, Info, useFeedback } from "../components/ui";
import { id } from "../lib/format";
export function Auth() {
  const { db } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState<Role>("advogado");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [selected, setSelected] = useState("a1");
  const [created, setCreated] = useState<string>();
  const [recovery, setRecovery] = useState(false);
  const [verificationAt, setVerificationAt] = useState(Date.now());
  const [clock, setClock] = useState(Date.now());
  const [verificationEmail, setVerificationEmail] = useState("");
  useEffect(() => {
    if (mode !== "verify") return;
    const t = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(t);
  }, [mode]);
  const { run, toast } = useFeedback();
  const [registrationDraft] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(sessionStorage.getItem("elo-registration") || "{}");
    } catch {
      return {};
    }
  });
  const enter = (u: User, code: string, demo = false) => {
    requireThat(u.active, "Acesso indisponível.");
    if (u.role === "administracao" || u.mfa)
      requireThat(code === "123456", "Informe o fator demonstrativo 123456.");
    transact((d) => audit(d, u, "Entrar na conta", "Sessão demonstrativa"));
    login(u);
    const target = params.get("retorno");
    navigate(
      target && target.startsWith("/" + u.role + "/")
        ? target
        : "/" +
            u.role +
            (u.role === "administracao"
              ? ""
              : demo
                ? "/inicio"
                : u.role === "advogado"
                  ? "/clientes"
                  : "/processos"),
    );
  };
  const submit = (fd: FormData) => {
    setError("");
    try {
      requireThat(
        Date.now() > blockedUntil,
        "Aguarde um minuto antes de tentar novamente.",
      );
      if (mode === "recover") {
        setRecovery(true);
        return;
      }
      if (mode === "verify") {
        requireThat(
          Date.now() - verificationAt < 600000,
          "Código expirado. Solicite outro código.",
        );
        requireThat(
          verificationEmail === db.users.find((u) => u.id === created)?.email,
          "Salve o novo endereço antes de confirmar.",
        );
        requireThat(
          fd.get("code") === "123456",
          "Código inválido. Use 123456 na demonstração.",
        );
        transact((d) => {
          const u = d.users.find((u) => u.id === created)!;
          u.emailVerified = true;
        });
        setMode("login");
        toast("E-mail confirmado. Entre com os dados cadastrados.");
        return;
      }
      if (mode === "register") {
        const email = String(fd.get("email")).toLowerCase().trim();
        requireThat(
          !db.users.some((u) => u.email === email),
          "Não foi possível criar a conta com os dados informados.",
        );
        const uid = id();
        const u: User = {
          id: uid,
          name: String(fd.get("name")),
          email,
          role,
          password: String(fd.get("password")),
          phone: String(fd.get("phone")),
          active: true,
          verified: role !== "advogado",
          emailVerified: false,
          mfa: false,
          preferences: { Mensagens: true, Convites: true, Documentos: true },
        };
        if (role === "advogado") {
          u.oab = String(fd.get("oab"));
          const requestedOffice = String(fd.get("office")).trim();
          u.requestedOffice = requestedOffice || undefined;
          u.office =
            requestedOffice &&
            !db.users.some((u) => u.office === requestedOffice)
              ? requestedOffice
              : undefined;
          const proof = fd.get("proof");
          if (proof instanceof File && proof.size > 0)
            u.professionalEvidence = [
              { name: proof.name, size: proof.size, mime: proof.type },
            ];
          requireThat(
            /^\d{1,6}\/[A-Z]{2}$/.test(u.oab),
            "Informe OAB no formato 123456/SP.",
          );
          requireThat(
            !db.users.some((x) => x.oab === u.oab),
            "Inscrição indisponível para cadastro.",
          );
        }
        transact((d) => {
          d.users.push(u);
          audit(d, u, "Criar conta", "Cadastro");
        });
        setCreated(uid);
        setVerificationEmail(email);
        setVerificationAt(Date.now());
        setMode("verify");
        return;
      }
      const u = db.users.find(
        (u) =>
          u.email === String(fd.get("email")).toLowerCase().trim() &&
          u.password === fd.get("password") &&
          (u.role === role ||
            (role === "advogado" && u.role === "administracao")) &&
          u.active,
      );
      requireThat(u, "Credenciais inválidas para o perfil selecionado.");
      if (!u!.emailVerified) {
        setCreated(u!.id);
        setVerificationEmail(u!.email);
        setVerificationAt(Date.now());
        setMode("verify");
        return;
      }
      enter(u!, String(fd.get("code") || ""));
    } catch (e) {
      setError((e as Error).message);
      setAttempts((n) => n + 1);
      if (attempts >= 4) {
        setBlockedUntil(Date.now() + 60000);
        setAttempts(0);
      }
    }
  };
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Link className="brand" to="/login">
          <span className="brand-mark">
            <Scale size={28} />
          </span>
          <span>
            elo<span className="brand-light">jurídico</span>
            <small>CONEXÕES QUE SIMPLIFICAM</small>
          </span>
        </Link>
        <div className="auth-story-content">
          <span className="eyebrow">A PRÓXIMA CONVERSA COMEÇA AQUI</span>
          <h1>
            Mais clareza.
            <br />
            Mais proximidade.
            <br />
            <em>Um novo elo.</em>
          </h1>
          <p>
            Processos, documentos e conversas reunidos para aproximar você de
            quem importa.
          </p>
          <div className="story-features">
            <span>
              <MessageSquare size={20} /> Atendimento conectado
            </span>
            <span>
              <FolderOpen size={20} /> Documentos organizados
            </span>
            <span>
              <ShieldCheck size={20} /> Cada informação em seu contexto
            </span>
          </div>
        </div>
        <small>Seu escritório, mais próximo. © 2026 Elo Jurídico</small>
      </section>
      <section className="auth-form-area">
        <div className="auth-form">
          <span className="eyebrow">BEM-VINDO AO ELO JURÍDICO</span>
          <h2>
            {mode === "register"
              ? "Crie seu próximo elo"
              : mode === "recover"
                ? "Recuperar acesso"
                : mode === "verify"
                  ? "Confirme seu e-mail"
                  : "Bom ter você por aqui."}
          </h2>
          <p className="muted">
            {mode === "login"
              ? "Acesse sua conta para continuar de onde parou."
              : "Fluxo demonstrativo, sem envio de e-mails reais."}
          </p>
          <div className="segmented">
            {(["advogado", "cliente"] as const).map((r) => (
              <button
                key={r}
                className={role === r ? "active" : ""}
                onClick={() => {
                  setRole(r);
                  setError("");
                }}
              >
                {r === "advogado" ? "Advogado" : "Cliente"}
              </button>
            ))}
          </div>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          {recovery ? (
            <Info>
              Se houver uma conta compatível, as instruções seriam enviadas ao
              endereço informado. Nesta demonstração, as contas iniciais
              utilizam Demo@123.
            </Info>
          ) : (
            <Form
              key={mode + role}
              onSubmit={submit}
              onChange={(e) => {
                if (mode !== "register") return;
                const el = e.target as HTMLInputElement;
                if (
                  ["name", "email", "phone", "oab", "office"].includes(el.name)
                ) {
                  const data = JSON.parse(
                    sessionStorage.getItem("elo-registration") || "{}",
                  );
                  data[el.name] = el.value;
                  sessionStorage.setItem(
                    "elo-registration",
                    JSON.stringify(data),
                  );
                }
              }}
            >
              {mode === "verify" ? (
                <>
                  <Info>
                    Use o código demonstrativo 123456. Ele não representa uma
                    verificação real.
                  </Info>
                  <Field label="Código de confirmação">
                    <input
                      name="code"
                      required
                      pattern="[0-9]{6}"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                    />
                  </Field>
                  <button
                    className="text-link"
                    type="button"
                    disabled={clock - verificationAt < 30000}
                    onClick={() => {
                      setVerificationAt(Date.now());
                      toast("Código demonstrativo reenviado: 123456.");
                    }}
                  >
                    Reenviar código
                    {clock - verificationAt < 30000
                      ? ` em ${Math.ceil((30000 - clock + verificationAt) / 1000)}s`
                      : ""}
                  </button>
                  <Field label="E-mail de confirmação">
                    <input
                      type="email"
                      value={verificationEmail}
                      onChange={(e) => setVerificationEmail(e.target.value)}
                      required
                    />
                  </Field>
                  <button
                    className="text-link"
                    type="button"
                    onClick={() =>
                      run(() => {
                        requireThat(
                          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verificationEmail),
                          "Informe um e-mail válido.",
                        );
                        transact((d) => {
                          requireThat(
                            !d.users.some(
                              (u) =>
                                u.email === verificationEmail &&
                                u.id !== created,
                            ),
                            "Endereço indisponível.",
                          );
                          const u = d.users.find((u) => u.id === created)!;
                          u.email = verificationEmail;
                          u.emailVerified = false;
                          audit(d, u, "Alterar e-mail de confirmação", u.id);
                        });
                        setVerificationAt(Date.now());
                      }, "Novo endereço salvo. Código demonstrativo: 123456.")
                    }
                  >
                    Salvar novo e-mail e reenviar
                  </button>
                </>
              ) : (
                <>
                  {mode === "register" && (
                    <>
                      <Field label="Nome completo">
                        <input
                          name="name"
                          required
                          minLength={3}
                          defaultValue={registrationDraft.name}
                        />
                      </Field>
                      <Field label="Telefone">
                        <input
                          name="phone"
                          required
                          type="tel"
                          defaultValue={registrationDraft.phone}
                        />
                      </Field>
                    </>
                  )}
                  <Field label="E-mail">
                    <input
                      name="email"
                      defaultValue={
                        mode === "register"
                          ? registrationDraft.email
                          : undefined
                      }
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="seu@email.com"
                    />
                  </Field>
                  {mode !== "recover" && (
                    <Field
                      label="Senha"
                      hint={
                        mode === "register"
                          ? "Use pelo menos 8 caracteres."
                          : undefined
                      }
                    >
                      <input
                        name="password"
                        type="password"
                        minLength={8}
                        required
                        autoComplete={
                          mode === "register"
                            ? "new-password"
                            : "current-password"
                        }
                        placeholder="Sua senha"
                      />
                    </Field>
                  )}
                  {mode === "login" && (
                    <Field
                      label={
                        role === "administracao"
                          ? "Fator adicional"
                          : "Fator adicional (se ativado)"
                      }
                      hint="Código da demonstração: 123456"
                    >
                      <input
                        name="code"
                        required={role === "administracao"}
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                      />
                    </Field>
                  )}
                  {mode === "register" && role === "advogado" && (
                    <>
                      <Field label="OAB e estado">
                        <input
                          name="oab"
                          defaultValue={registrationDraft.oab}
                          required
                          placeholder="123456/SP"
                          pattern="[0-9]{1,6}/[A-Z]{2}"
                        />
                      </Field>
                      <Field
                        label="Escritório (opcional)"
                        hint="Vínculos com equipes existentes dependem de convite autorizado."
                      >
                        <input
                          name="office"
                          defaultValue={registrationDraft.office}
                        />
                      </Field>
                      <Field label="CPF">
                        <input
                          name="cpf"
                          required
                          pattern="[0-9]{11}"
                          placeholder="11 dígitos"
                        />
                      </Field>
                      <Field label="Comprovante profissional">
                        <input
                          name="proof"
                          required
                          type="file"
                          accept=".pdf,.png,.jpg"
                        />
                      </Field>
                    </>
                  )}
                  {mode === "register" && (
                    <label className="check-field">
                      <input required type="checkbox" />
                      Li os{" "}
                      <Link to="/sistema/termos">termos demonstrativos</Link> e
                      a <Link to="/sistema/privacidade">privacidade</Link>.
                    </label>
                  )}
                </>
              )}
              <button className="button primary full" type="submit">
                {mode === "register"
                  ? "Criar conta"
                  : mode === "recover"
                    ? "Solicitar recuperação"
                    : mode === "verify"
                      ? "Confirmar código"
                      : "Entrar na minha conta"}
                <ArrowRight size={18} />
              </button>
            </Form>
          )}
          <div className="auth-links">
            {mode === "login" ? (
              <>
                <button
                  onClick={() => {
                    setMode("recover");
                    setRecovery(false);
                    setError("");
                  }}
                >
                  Esqueci minha senha
                </button>
                {role !== "administracao" && (
                  <button
                    onClick={() => {
                      setMode("register");
                      setError("");
                    }}
                  >
                    Criar conta
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => {
                  setMode("login");
                  setRecovery(false);
                  setError("");
                }}
              >
                Voltar para entrar
              </button>
            )}
          </div>
          {mode === "login" && (
            <div className="demo-access">
              <div>
                <BriefcaseBusiness size={18} />
                <strong>Explore a demonstração</strong>
              </div>
              <p>Dados fictícios. Nenhuma informação é enviada.</p>
              <Field label="Conta de demonstração">
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {db.users
                    .filter((u) =>
                      ["a1", "a2", "a4", "c1", "c11", "a5"].includes(u.id),
                    )
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ·{" "}
                        {u.role === "administracao"
                          ? "Sócio"
                          : u.role === "cliente"
                            ? "Cliente"
                            : u.office
                              ? "Escritório"
                              : "Individual"}
                      </option>
                    ))}
                </select>
              </Field>
              <button
                className="button secondary full"
                onClick={() =>
                  run(() =>
                    enter(
                      db.users.find((u) => u.id === selected)!,
                      "123456",
                      true,
                    ),
                  )
                }
              >
                Acessar demonstração
                <ArrowRight size={16} />
              </button>
            </div>
          )}
          <p className="auth-foot">
            Autenticação local de demonstração. Não utilize dados reais.
          </p>
        </div>
      </section>
    </div>
  );
}
