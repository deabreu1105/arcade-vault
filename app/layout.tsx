import type { Metadata } from "next";
import { Press_Start_2P, JetBrains_Mono, Courier_Prime } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { SkinProvider } from "@/components/skin-provider";
import { DEFAULT_SKIN, SKIN_IDS, SKIN_STORAGE_KEY } from "@/lib/skins";
import { Nav } from "@/components/nav";
import "./globals.css";

const pressStart2P = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  weight: ["400", "700"],
  subsets: ["latin"],
});

// Corre de forma síncrona mientras el navegador parsea el HTML, antes del primer paint, para que
// los covers no se pinten con el skin equivocado y luego salten. La lista de skins se interpola
// desde SKIN_IDS para que no pueda derivar de lib/skins.ts.
const SKIN_BOOTSTRAP = `(function(){try{var s=localStorage.getItem(${JSON.stringify(
  SKIN_STORAGE_KEY,
)});if(${JSON.stringify(
  SKIN_IDS,
)}.indexOf(s)>-1)document.documentElement.setAttribute("data-skin",s)}catch(e){}})()`;

export const metadata: Metadata = {
  title: "Arcade Vault",
  description: "Play games online and compete for the highest score.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning en <html> porque SKIN_BOOTSTRAP reescribe data-skin antes de que
    // React hidrate, y en <body> porque las extensiones del navegador le inyectan atributos
    // propios ahí (Grammarly pone data-gr-ext-installed, por ejemplo) y React lo reporta como
    // desajuste. Ninguno de los dos elementos renderiza atributos dinámicos nuestros, así que no
    // hay un desajuste real que estas banderas puedan estar tapando.
    <html
      lang="es"
      data-skin={DEFAULT_SKIN}
      suppressHydrationWarning
      className={`${pressStart2P.variable} ${jetBrainsMono.variable} ${courierPrime.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SKIN_BOOTSTRAP }} />
      </head>
      <body className="h-full" suppressHydrationWarning>
        <div className="av-bg"></div>
        <div className="av-noise"></div>
        <div id="root">
          <SkinProvider>
            <AuthProvider>
              <Nav />
              <main className="av-main">{children}</main>
              <footer
                style={{
                  borderTop: "1px solid var(--line)",
                  padding: "20px 32px",
                  textAlign: "center",
                  color: "var(--ink-faint)",
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  letterSpacing: "0.16em",
                }}
              >
                © 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0
              </footer>
            </AuthProvider>
          </SkinProvider>
        </div>
      </body>
    </html>
  );
}
