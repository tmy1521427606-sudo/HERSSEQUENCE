"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authenticate, type AuthResult, type AuthUser } from "@/lib/auth-utils";
import { AuthContext, type LoginMode } from "@/components/auth-context";
import LoginDialog from "@/components/LoginDialog";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<LoginMode>("login");

  const signIn = useCallback((username: string, password: string): AuthResult => {
    const result = authenticate(username, password);
    if (result.ok) setUser(result.user);
    return result;
  }, []);

  const signOut = useCallback(() => setUser(null), []);

  const openLogin = useCallback((next: LoginMode = "login") => {
    setMode(next);
    setDialogOpen(true);
  }, []);

  const closeLogin = useCallback(() => setDialogOpen(false), []);

  // 免点击入口：URL 带 ?login=1 时进入页面就直接弹出登录窗口。
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("login") === "1") {
      setMode("login");
      setDialogOpen(true);
    }
  }, []);

  const value = useMemo(
    () => ({ user, dialogOpen, mode, signIn, signOut, openLogin, closeLogin }),
    [user, dialogOpen, mode, signIn, signOut, openLogin, closeLogin],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginDialog open={dialogOpen} mode={mode} onClose={closeLogin} />
    </AuthContext.Provider>
  );
}
