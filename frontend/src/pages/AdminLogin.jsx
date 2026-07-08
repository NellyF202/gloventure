import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api, { setToken, getToken } from "../lib/api";
import logo from "../assets/logo.png";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (getToken()) nav("/admin/dashboard", { replace: true });
  }, [nav]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/admin/login", { email, password });
      setToken(data.access_token);
      toast.success("Welcome back, admin.");
      nav("/admin/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--glo-cream)" }}>
      <div className="container-glo pt-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--glo-text-2)" }} data-testid="admin-login-back">
          <ArrowLeft size={16} /> Back to home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-16">
        <form onSubmit={submit} className="w-full max-w-md card-solution" data-testid="admin-login-form">
          <img src={logo} alt="GLO Venture" className="h-12 w-auto mb-2" />
          <h1 className="font-display text-3xl" style={{ color: "var(--glo-text)" }}>Admin <span className="italic-green">login</span></h1>
          <p className="text-sm" style={{ color: "var(--glo-text-2)" }}>Sign in to manage GLO Venture orders.</p>

          <div className="mt-2">
            <label className="text-sm" style={{ color: "var(--glo-text-2)" }}>Email</label>
            <input
              className="glo-input mt-1"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="admin-login-email"
            />
          </div>
          <div>
            <label className="text-sm" style={{ color: "var(--glo-text-2)" }}>Password</label>
            <input
              className="glo-input mt-1"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="admin-login-password"
            />
          </div>

          <button type="submit" className="btn-primary w-full mt-2" disabled={busy} data-testid="admin-login-submit">
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
