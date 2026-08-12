"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type SessionUser = { name: string } | null;

type ScoreEntry = { game: string; score: number; name: string };

type AuthContextValue = {
  user: SessionUser;
  login: (user: SessionUser) => void;
  logout: () => void;
  saveScore: (entry: ScoreEntry) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readUser(): SessionUser {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem("av_user") || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser>(readUser);

  const login = (nextUser: SessionUser) => {
    setUser(nextUser);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("av_user", JSON.stringify(nextUser));
    }
  };

  const logout = () => {
    setUser(null);
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
    <AuthContext.Provider value={{ user, login, logout, saveScore }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
