import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { useStore } from "../store/store";
export function ScrollMemory() {
  const { pathname } = useLocation();
  const { user } = useStore();
  const uid = user?.id;
  useLayoutEffect(() => {
    const key = "elo-scroll:" + uid + ":" + pathname;
    window.scrollTo(0, Number(sessionStorage.getItem(key) || 0));
    const save = () => sessionStorage.setItem(key, String(window.scrollY));
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, [pathname, uid]);
  return null;
}
