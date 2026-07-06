import { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, RefreshCcw, Phone, MapPin, MessageCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import api, { clearToken, getToken, formatMWK, buildWhatsappLink } from "../lib/api";

const STATUSES = ["pending", "confirmed", "out_for_delivery", "delivered", "cancelled"];
const HTTP_UNAUTHORIZED = 401;

export default function AdminDashboard() {
  const nav = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, s] = await Promise.all([api.get("/orders"), api.get("/admin/stats")]);
      setOrders(o.data);
      setStats(s.data);
    } catch (e) {
      if (e?.response?.status === HTTP_UNAUTHORIZED) {
        clearToken();
        nav("/admin/login", { replace: true });
      } else {
        toast.error("Failed to load orders");
      }
    } finally {
      setLoading(false);
    }
  }, [nav]);

  useEffect(() => {
    if (!getToken()) {
      nav("/admin/login", { replace: true });
      return;
    }
    load();
  }, [load, nav]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}`, { status });
      toast.success("Status updated");
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch {
      toast.error("Update failed");
    }
  };

  const logout = () => {
    clearToken();
    nav("/admin/login", { replace: true });
  };

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="min-h-screen" style={{ background: "var(--glo-cream)" }}>
      <header className="border-b" style={{ background: "rgba(250,243,236,0.85)", borderColor: "var(--glo-border)" }}>
        <div className="container-glo flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3" data-testid="admin-logo">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-display" style={{ background: "var(--glo-green)" }}>G</div>
            <div>
              <div className="font-display text-lg" style={{ color: "var(--glo-text)" }}>GLO Venture</div>
              <div className="text-xs" style={{ color: "var(--glo-text-3)" }}>Admin Console</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={load} className="btn-secondary" data-testid="admin-refresh">
              <RefreshCcw size={16} /> Refresh
            </button>
            <button onClick={logout} className="btn-primary" data-testid="admin-logout">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <section className="container-glo py-10">
        <h1 className="font-display text-4xl" style={{ color: "var(--glo-text)" }}>
          Orders <span className="italic-green">overview</span>
        </h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6" data-testid="admin-stats">
          <StatCard label="Total orders" value={stats.total_orders ?? 0} />
          <StatCard label="Pending" value={stats.pending ?? 0} />
          <StatCard label="Delivered" value={stats.delivered ?? 0} />
          <StatCard label="Revenue" value={formatMWK(stats.revenue_mwk ?? 0)} />
        </div>

        <div className="mt-8 flex flex-wrap gap-2" data-testid="admin-filters">
          {["all", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="px-4 py-2 rounded-full text-sm font-semibold capitalize"
              style={{
                background: filter === s ? "var(--glo-green)" : "rgba(255,255,255,0.6)",
                color: filter === s ? "#fff" : "var(--glo-text-2)",
                border: "1px solid var(--glo-border)",
              }}
              data-testid={`admin-filter-${s}`}
            >
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4">
          {loading && <p style={{ color: "var(--glo-text-3)" }}>Loading orders…</p>}
          {!loading && visible.length === 0 && (
            <div className="card-solution text-center">
              <p style={{ color: "var(--glo-text-3)" }}>No orders to show.</p>
            </div>
          )}
          {visible.map((o) => (
            <div key={o.id} className="card-solution" data-testid={`order-row-${o.id}`}>
              <div className="flex flex-wrap justify-between gap-4 items-start">
                <div>
                  <p className="font-display text-xl" style={{ color: "var(--glo-text)" }}>{o.customer_name}</p>
                  <p className="text-xs font-mono" style={{ color: "var(--glo-text-3)" }}>#{o.id.slice(0, 8)}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm" style={{ color: "var(--glo-text-2)" }}>
                    <span className="inline-flex items-center gap-1.5"><Phone size={14} /> {o.phone}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {o.location} · {o.address_details}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`status-pill status-${o.status}`} data-testid={`order-status-${o.id}`}>{o.status.replace(/_/g, " ")}</span>
                  <span className="font-display text-2xl" style={{ color: "var(--glo-green)" }}>{formatMWK(o.total_mwk)}</span>
                </div>
              </div>

              <ul className="text-sm divide-y mt-2" style={{ borderColor: "var(--glo-border)" }}>
                {o.items?.map((it, i) => (
                  <li key={i} className="py-2 flex justify-between">
                    <span style={{ color: "var(--glo-text-2)" }}><ShoppingBag size={14} className="inline mr-1" /> {it.quantity} × {it.size_kg}kg bag</span>
                    <span>{formatMWK(it.line_total_mwk)}</span>
                  </li>
                ))}
              </ul>

              {o.notes && (
                <p className="text-xs italic" style={{ color: "var(--glo-text-3)" }}>“{o.notes}”</p>
              )}

              <div className="flex flex-wrap gap-2 mt-2">
                <select
                  className="glo-input"
                  style={{ width: "auto" }}
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  data-testid={`order-status-select-${o.id}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
                <a
                  href={`tel:${o.phone}`}
                  className="btn-secondary"
                  data-testid={`order-call-${o.id}`}
                >
                  <Phone size={16} /> Call
                </a>
                <a
                  href={buildWhatsappLink(`Hello ${o.customer_name}, this is GLO Venture about your order #${o.id.slice(0, 8)}.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-whatsapp"
                  data-testid={`order-whatsapp-${o.id}`}
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const StatCard = ({ label, value }) => (
  <div className="card-solution">
    <p className="text-xs uppercase tracking-widest" style={{ color: "var(--glo-text-3)" }}>{label}</p>
    <p className="font-display text-3xl mt-2" style={{ color: "var(--glo-green)" }}>{value}</p>
  </div>
);
