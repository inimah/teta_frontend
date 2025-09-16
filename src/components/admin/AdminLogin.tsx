import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../lib/api";
import { setAuth } from "../../lib/auth";

declare global {
  interface Window {
    google?: any;
  }
}

const AdminLogin: React.FC = () => {
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as any)?.from?.pathname || "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const query = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  useEffect(() => {
    if (query.get("expired")) {
      toast.info("Sesi berakhir. Silakan login ulang.");
    }
  }, [query]);

  async function doPasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      // Ganti endpoint ini sesuai backend kamu kalau beda
      const { data } = await api.post("/auth/login", { email, password });
      // Backend diharapkan mengembalikan: { token, user: { userId, email, name, role } }
      if (data?.user?.role !== "admin") {
        toast.error("Akun ini bukan admin.");
        return;
      }
      setAuth(data.token, data.user);
      toast.success("Login admin berhasil.");
      nav(from, { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login gagal.");
    } finally {
      setBusy(false);
    }
  }

  // --- Google Sign-In (opsional) ---
  useEffect(() => {
    if (!window.google) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (resp: any) => {
        try {
          setBusy(true);
          const { data } = await api.post("/auth/google-login", {
            googleToken: resp.credential,
          });
          if (data?.user?.role !== "admin") {
            toast.error("Akun Google ini bukan admin.");
            return;
          }
          setAuth(data.token, data.user);
          toast.success("Login admin (Google) berhasil.");
          nav(from, { replace: true });
        } catch (e: any) {
          toast.error(e?.response?.data?.message || "Login Google gagal.");
        } finally {
          setBusy(false);
        }
      },
    });

    const btn = document.getElementById("googleBtn");
    if (btn) {
      window.google.accounts.id.renderButton(btn, {
        theme: "outline",
        size: "large",
        type: "standard",
        shape: "pill",
        text: "signin_with",
      });
    }
  }, [nav, from]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-blue-100 p-8">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-2">Admin Login</h1>
        <p className="text-sm text-center text-gray-500 mb-6">
          Masuk untuk mengelola dashboard admin.
        </p>

        <form onSubmit={doPasswordLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="admin@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className={`w-full py-2 rounded-lg text-white font-semibold transition ${
              busy ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {busy ? "Memproses..." : "Masuk"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-x text-gray-400">atau</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google button (opsional) */}
        <div id="googleBtn" className="flex justify-center" />

        <div className="text-x text-center text-gray-400 mt-6">
          Bukan admin? <Link to="/" className="text-blue-600">Login pengguna</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
