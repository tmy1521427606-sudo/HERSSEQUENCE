"use client";

import { createContext, useContext } from "react";
import type { AuthResult, AuthUser } from "@/lib/auth-utils";

export type LoginMode = "login" | "reminder";

export type AuthContextValue = {
  user: AuthUser | null;
  dialogOpen: boolean;
  mode: LoginMode;
  signIn: (username: string, password: string) => AuthResult;
  signOut: () => void;
  openLogin: (mode?: LoginMode) => void;
  closeLogin: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth 必须在 AuthProvider 内部使用");
  return value;
}
