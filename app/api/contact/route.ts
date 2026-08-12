import { Resend } from "resend";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { name, email, msg } = await request.json();

  if (!name?.trim() || !email?.trim() || !msg?.trim()) {
    return Response.json({ ok: false, error: "Faltan campos requeridos." }, { status: 400 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: process.env.CONTACT_TO_EMAIL!,
      subject: `Nuevo mensaje de contacto de ${name.trim()}`,
      text: `De: ${name.trim()} <${email.trim()}>\n\n${msg.trim()}`,
    });

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "No se pudo enviar el mensaje." }, { status: 500 });
  }
}
