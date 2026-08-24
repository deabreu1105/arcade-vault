"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SKIN,
  SKINS,
  SKIN_STORAGE_KEY,
  isSkinId,
  type SkinId,
  type SkinPalette,
} from "@/lib/skins";

/**
 * Lee la preferencia guardada. Es la misma fuente que consulta el script inline de
 * `app/layout.tsx`, así que el estado inicial de React y el DOM siempre coinciden y no hay
 * desajuste de hidratación.
 */
function readSkin(): SkinId {
  if (typeof window === "undefined") return DEFAULT_SKIN;
  try {
    const stored = window.localStorage.getItem(SKIN_STORAGE_KEY);
    return isSkinId(stored) ? stored : DEFAULT_SKIN;
  } catch {
    return DEFAULT_SKIN;
  }
}

type SkinContextValue = {
  skin: SkinId;
  /** La paleta del skin activo, lista para pasarle a un motor con `setPalette()`. */
  palette: SkinPalette;
  setSkin: (skin: SkinId) => void;
};

const SkinContext = createContext<SkinContextValue | null>(null);

export function SkinProvider({ children }: { children: ReactNode }) {
  // Inicializador perezoso, igual que `readGuestUser` en components/auth-provider.tsx: el primer
  // render del cliente ya conoce el skin real, así que nadie ve el default y desaparece la
  // ventana en la que el motor podría arrancar con la paleta equivocada.
  const [skin, setSkinState] = useState<SkinId>(readSkin);

  // En desarrollo, el remonte de Strict Mode devuelve <html> a los atributos que React maneja
  // desde JSX y borra el que puso el script inline. Reponerlo acá es un no-op en producción.
  useLayoutEffect(() => {
    document.documentElement.dataset.skin = readSkin();
  }, []);

  const setSkin = useCallback((next: SkinId) => {
    setSkinState(next);
    document.documentElement.dataset.skin = next;
    try {
      window.localStorage.setItem(SKIN_STORAGE_KEY, next);
    } catch {
      // Modo privado o almacenamiento deshabilitado: el skin vale para esta sesión y ya.
    }
  }, []);

  return (
    <SkinContext.Provider value={{ skin, palette: SKINS[skin], setSkin }}>
      {children}
    </SkinContext.Provider>
  );
}

export function useSkin() {
  const ctx = useContext(SkinContext);
  if (!ctx) throw new Error("useSkin must be used within a SkinProvider");
  return ctx;
}
