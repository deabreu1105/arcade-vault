"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error: string } | null;

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const username = String(formData.get("username") || "");

  if (!email || !password || !username) {
    return { error: "Completa usuario, correo y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username: username.toUpperCase().slice(0, 10) } },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/biblioteca");
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Completa correo y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  redirect("/biblioteca");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
