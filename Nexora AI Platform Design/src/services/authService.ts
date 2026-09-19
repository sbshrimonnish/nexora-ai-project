/**
 * Nexora AI — Auth Service
 * Manages JWT tokens, login/logout, and demo user session state.
 */

const TOKEN_KEY = 'nexora_auth_token';
const USER_KEY = 'nexora_user';

export interface UserSession {
  username: string;
  role: string;
  authenticatedAt: string;
}

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setSession(token: string, username: string, role: string = 'Admin'): void {
    localStorage.setItem(TOKEN_KEY, token);
    const session: UserSession = {
      username,
      role,
      authenticatedAt: new Date().toISOString(),
    };
    localStorage.setItem(USER_KEY, JSON.stringify(session));
  },

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getUser(): UserSession | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserSession;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  },
};
