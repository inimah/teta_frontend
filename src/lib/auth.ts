export type AuthUser = {
  userId: string;
  email: string;
  name: string;
  role: string; // "admin" | "user"
};

export function setAuth(token: string, user: AuthUser) {
  localStorage.setItem("authToken", token);
  localStorage.setItem("authUser", JSON.stringify(user));
}

export function getAuth(): { token: string | null; user: AuthUser | null } {
  const token = localStorage.getItem("authToken");
  const userRaw = localStorage.getItem("authUser");
  return { token, user: userRaw ? JSON.parse(userRaw) : null };
}

export function clearAuth() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
}

export function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(atob(base64).split("").map(c =>
      "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
    ).join("")));
  } catch {
    return {};
  }
}

export function isTokenExpired(token: string) {
  const { exp } = parseJwt(token) as { exp?: number };
  if (!exp) return false;
  return Date.now() >= exp * 1000;
}
