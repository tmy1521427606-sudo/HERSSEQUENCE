import { authCopy, demoAccount } from "@/auth-content";

export type AuthUser = {
  username: string;
  displayName: string;
  initial: string;
  /** 登录时间（毫秒），仅用于当前会话展示。 */
  signedInAt: number;
};

export type AuthResult = { ok: true; user: AuthUser } | { ok: false; error: string };

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * 在浏览器内校验账号。通过时返回会话用户对象，失败时返回可直接展示的错误文案。
 */
export function authenticate(username: string, password: string, now: number = Date.now()): AuthResult {
  const name = normalizeUsername(username);
  const secret = password.trim();
  if (!name || !secret) return { ok: false, error: authCopy.errorEmpty };

  const matches = name === normalizeUsername(demoAccount.username) && secret === demoAccount.password;
  if (!matches) return { ok: false, error: authCopy.errorInvalid };

  return {
    ok: true,
    user: {
      username: name,
      displayName: demoAccount.displayName,
      initial: demoAccount.initial,
      signedInAt: now,
    },
  };
}

export function isSignedIn(user: AuthUser | null): boolean {
  return Boolean(user);
}

export function accountLabel(user: AuthUser | null): string {
  return user ? user.displayName : authCopy.signedIn;
}
