export const usesHashRouting = import.meta.env.VITE_ROUTER_MODE === "hash";

export function loginHref() {
  return `${import.meta.env.BASE_URL}${usesHashRouting ? "#/login" : "login"}`;
}
