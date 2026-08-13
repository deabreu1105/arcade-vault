"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { signInAction, signUpAction } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [tab, setTab] = useState<"in" | "up">("in");

  const [signInState, signInFormAction, signInPending] = useActionState(signInAction, null);
  const [signUpState, signUpFormAction, signUpPending] = useActionState(signUpAction, null);

  const playAsGuest = () => {
    login(null);
    router.push("/biblioteca");
  };

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark"></div>
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              letterSpacing: "0.16em",
              marginTop: 6,
            }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        <div className="auth-tabs">
          <button className={tab === "in" ? "on" : ""} onClick={() => setTab("in")}>
            INICIAR SESIÓN
          </button>
          <button className={tab === "up" ? "on" : ""} onClick={() => setTab("up")}>
            CREAR CUENTA
          </button>
        </div>

        {tab === "in" ? (
          <form action={signInFormAction}>
            <div className="field">
              <label>Correo electrónico</label>
              <input type="email" name="email" placeholder="jugador@vault.gg" required />
            </div>
            <div className="field">
              <label>Contraseña</label>
              <input type="password" name="password" placeholder="••••••••" required />
            </div>

            {signInState?.error && (
              <div className="mono" style={{ color: "var(--magenta)", fontSize: 11, marginTop: 8 }}>
                {signInState.error}
              </div>
            )}

            <button
              className="btn lg"
              type="submit"
              style={{ width: "100%", marginTop: 8 }}
              disabled={signInPending}
            >
              {signInPending ? "ENTRANDO..." : "ENTRAR AL VAULT"}
            </button>
          </form>
        ) : (
          <form action={signUpFormAction}>
            <div className="field">
              <label>Usuario</label>
              <input name="username" placeholder="px_kai" required />
            </div>
            <div className="field slide-in">
              <label>Correo electrónico</label>
              <input type="email" name="email" placeholder="jugador@vault.gg" required />
            </div>
            <div className="field">
              <label>Contraseña</label>
              <input type="password" name="password" placeholder="••••••••" required />
            </div>

            {signUpState?.error && (
              <div className="mono" style={{ color: "var(--magenta)", fontSize: 11, marginTop: 8 }}>
                {signUpState.error}
              </div>
            )}

            <button
              className="btn lg"
              type="submit"
              style={{ width: "100%", marginTop: 8 }}
              disabled={signUpPending}
            >
              {signUpPending ? "CREANDO..." : "CREAR Y JUGAR"}
            </button>
          </form>
        )}

        <button
          className="btn ghost"
          style={{ width: "100%", marginTop: 10 }}
          onClick={playAsGuest}
        >
          JUGAR COMO INVITADO
        </button>

        <div className="auth-divider">O CONTINÚA CON</div>
        <div className="social">
          <button className="btn ghost" type="button">
            ◆ GOOGLE
          </button>
          <button className="btn ghost" type="button">
            ▣ GITHUB
          </button>
        </div>

        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 11,
            color: "var(--ink-faint)",
            letterSpacing: "0.1em",
          }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}
