"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/app/login/actions";

export type SessionUser = { id: string; name: string } | null;

type ScoreEntry = { game: string; score: number; name: string };

type AuthContextValue = {
  user: SessionUser;
  login: (user: SessionUser) => void;
  logout: () => void;
  saveScore: (entry: ScoreEntry) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readGuestUser(): SessionUser {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem("av_user") || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [guestUser, setGuestUser] = useState<SessionUser>(readGuestUser);
  const [supabaseUser, setSupabaseUser] = useState<SessionUser>(null);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const resolveProfile = async (userId: string) => {
      const { data } = await supabase.from("profiles").select("username").eq("id", userId).single();
      if (!cancelled) setSupabaseUser(data ? { id: userId, name: data.username } : null);
    };

    // supabase.auth.getUser() hits the Auth server directly, unlike getSession(),
    // so it picks up a session created moments ago by a Server Action on a
    // different (server-side) client — which a soft navigation wouldn't otherwise reveal.
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return;
      if (user) resolveProfile(user.id);
      else setSupabaseUser(null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        resolveProfile(session.user.id);
      } else {
        setSupabaseUser(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [pathname]);

  const login = (nextUser: SessionUser) => {
    setGuestUser(nextUser);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("av_user", JSON.stringify(nextUser));
    }
  };

  const logout = () => {
    if (supabaseUser) {
      setSupabaseUser(null);
      void signOutAction();
      return;
    }
    setGuestUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("av_user");
    }
  };

  const saveScore = (entry: ScoreEntry) => {
    if (typeof window === "undefined") return;
    try {
      const all = JSON.parse(window.localStorage.getItem("av_scores") || "[]");
      all.push({ ...entry, at: Date.now() });
      window.localStorage.setItem("av_scores", JSON.stringify(all));
    } catch {
      // localStorage unavailable or full — ignore, this is a mock persistence layer.
    }
  };

  return (
    <AuthContext.Provider value={{ user: supabaseUser ?? guestUser, login, logout, saveScore }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
