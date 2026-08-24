"use client";

import { SKIN_IDS, SKIN_LABELS, type SkinId } from "@/lib/skins";
import { useSkin } from "@/components/skin-provider";

/**
 * Selector de skin de la pantalla de juego. Cada posición se pinta con la paleta que aplica, así
 * que el control previsualiza lo que hace en vez de describirlo.
 *
 * Se monta solo en juegos con motor: los decorativos comparten la simulación `.game-arena`, que no
 * cambia con el skin, y ofrecer un control que no hace nada sería mentir.
 */
export function SkinSelector() {
  const { skin, setSkin } = useSkin();

  return (
    <div className="skin-switch" role="radiogroup" aria-label="Skin del juego">
      <span className="skin-switch-label" aria-hidden="true">
        Skin
      </span>
      <div className="skin-switch-track">
        {SKIN_IDS.map((id: SkinId) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={skin === id}
            data-skin-option={id}
            className="skin-switch-option"
            onClick={() => setSkin(id)}
          >
            {SKIN_LABELS[id]}
          </button>
        ))}
      </div>
    </div>
  );
}
