"use client";

import { useEffect, useRef } from "react";
import type { TouchButton } from "@/components/games/registry";

type TouchControlsProps = {
  buttons: TouchButton[];
  onDown: (code: string) => void;
  onUp: (code: string) => void;
};

/**
 * Overlay de botones táctiles sobre el canvas de un juego. No conoce nada de motores ni de
 * juegos concretos — solo códigos de tecla, posiciones y callbacks. Cada botón sintetiza
 * `onDown`/`onUp` con el mismo `code` que el motor ya escucha vía teclado.
 */
export function TouchControls({ buttons, onDown, onUp }: TouchControlsProps) {
  return (
    <div className="touch-controls" aria-hidden="true">
      {buttons.map((button) => (
        <TouchControlButton key={button.code} button={button} onDown={onDown} onUp={onUp} />
      ))}
    </div>
  );
}

function TouchControlButton({
  button,
  onDown,
  onUp,
}: {
  button: TouchButton;
  onDown: (code: string) => void;
  onUp: (code: string) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  // React registra `touchstart` como pasivo por defecto (para no bloquear el scroll del resto de
  // la página), así que `preventDefault()` en un handler JSX no tiene efecto y tira un warning en
  // consola. Un listener nativo con `{ passive: false }` — el mismo patrón que ya usa
  // game-canvas.tsx para el arrastre de Arkanoid — es lo único que de verdad evita el gesto.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      onDown(button.code);
    };
    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    return () => el.removeEventListener("touchstart", handleTouchStart);
  }, [button.code, onDown]);

  return (
    <button
      ref={ref}
      type="button"
      className="touch-controls__button"
      style={{ top: button.position.top, left: button.position.left }}
      tabIndex={-1}
      onTouchEnd={(e) => {
        e.preventDefault();
        onUp(button.code);
      }}
      onTouchCancel={(e) => {
        e.preventDefault();
        onUp(button.code);
      }}
    >
      {button.label}
    </button>
  );
}
