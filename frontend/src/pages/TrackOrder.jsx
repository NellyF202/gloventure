import { useState } from "react";
import { Link } from "react-router-dom";
import { PackageSearch, ArrowLeft, Phone, MapPin, ShoppingBag, CheckCircle2, Clock, Truck, XCircle, Package } from "lucide-react";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api, { formatMWK } from "../lib/api";

const STATUS_CONFIG = {
  pending:           { label: "Pending",           icon: Clock,        color: "var(--glo-ochre)",   bg: "var(--glo-ochre-soft, #fef3c7)" },
  confirmed:         { label: "Confirmed",         icon: CheckCircle2, color: "var(--glo-green)",   bg: "var(--glo-green-soft)" },
  out_for_delivery:  { label: "Out for Delivery",  icon: Truck,        color: "var(--glo-green)",   bg: "var(--glo-green-soft)" },
  delivered:         { label: "Delivered",         icon: CheckCircle2, color: "#16a34a",            bg: "#dcfce7" },
  cancelled:         { label: "Cancelled",         icon: XCircle,      color: "#dc2626",            bg: "#fee2e2" },
};

const STEPS = ["pending", "confirmed", "out_for_delivery", "delivered"];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, icon: Package, color: "var(--glo-text-3)", bg: "var(--glo-cream-2)" };
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
      <Icon size={14} /> {cfg.label}
    </span>
  );
}

function ProgressBar({ status }) {
  const idx = STEPS.indexOf(status);
  if (idx === -1) return null;
  return (
    <div className="mt-4">
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const done = i <= idx;
          const cfg = STATUS_CONFIG[step];
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: done ? "var(--glo-green)" : "var(--glo-border)", color: done ? "#fff" : "var(--glo-text-3)" }}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-1 mx-1" style={{ background: i < idx ? "var(--glo-green)" : "var(--glo-border)" }} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs" style={{ color: "var(--glo-text-3)" }}>
        {STEPS.map((step) => (
          <span key={step} className="text-center" style={{ flex: 1 }}>{STATUS_CONFIG[step].label}</span>
        ))}
      </div>
    </div>
  );
}

export default function TrackOrder() {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const isPhone = (q) => /^\+?[\d\s\-()]{6,}$/.test(q.trim());

  const search = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return toast.error("Please enter a phone number or order ID.");
    setLoading(true);
    setSearched(false);
    try {
      const params = isPhone(q) ? { phone: q } : { order_id: q };
      const { data } = await api.get("/track", { params });
      setOrders(data);
    } catch (err) {
      if (err?.response?.status === 404) {
        setOrders([]);
      } else {
        toast.error("Could not fetch orders. Please try again.");
      }
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <div style={{ background: "var(--glo-cream)", minHeight: "100vh" }}>
      <Navbar />

      <section className="section">
        <div className="container-glo max-w-2xl">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 text-sm" style={{ color: "var(--glo-text-2)" }}>
            <ArrowLeft size={16} /> Back to home
          </Link>

          <div className="mb-8">
            <div className="icon-tile icon-tile-green mb-4"><PackageSearch size={22} /></div>
            <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]" style={{ color: "var(--glo-text)" }}>
              Track your <span className="italic-green">order</span>
            </h1>
            <p className="mt-3 text-base" style={{ color: "var(--glo-text-2)" }}>
              Enter the phone number you used when ordering, or your order ID (the short code from your confirmation).
            </p>
          </div>

          <form onSubmit={search} className="card-solution" data-testid="track-form">
            <label className="text-sm font-semibold" style={{ color: "var(--glo-text-2)" }}>
              Phone number or Order ID
            </label>
            <div className="flex gap-3 mt-2">
              <input
                className="glo-input flex-1"
                placeholder="+265 886 750 499  or  abc12345"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                data-testid="track-input"
              />
              <button type="submit" disabled={loading} className="btn-primary" data-testid="track-submit">
                {loading ? "Searching…" : "Search"}
              </button>
            </div>
          </form>

          {searched && orders !== null && orders.length === 0 && (
            <div className="card-solution mt-6 text-center" data-testid="track-no-results">
              <PackageSearch size={32} style={{ color: "var(--glo-text-3)", margin: "0 auto 12px" }} />
              <p className="font-display text-xl" style={{ color: "var(--glo-text)" }}>No orders found</p>
              <p className="text-sm mt-2" style={{ color: "var(--glo-text-2)" }}>
                Double-check your phone number or order ID. If you ordered via WhatsApp, your order may still be pending.
              </p>
              <Link to="/order" className="btn-primary mt-4 inline-flex">
                <ShoppingBag size={16} /> Place a new order
              </Link>
            </div>
          )}

          {orders && orders.length > 0 && (
            <div className="mt-6 grid gap-5" data-testid="track-results">
              {orders.map((o) => (
                <div key={o.id} className="card-solution" data-testid={`track-order-${o.id}`}>
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div>
                      <p className="font-display text-xl" style={{ color: "var(--glo-text)" }}>{o.customer_name}</p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: "var(--glo-text-3)" }}>Order #{o.id.slice(0, 8)}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm" style={{ color: "var(--glo-text-2)" }}>
                        <span className="inline-flex items-center gap-1"><Phone size={13} /> {o.phone}</span>
                        <span className="inline-flex items-center gap-1"><MapPin size={13} /> {o.location}</span>
                      </div>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>

                  {o.status !== "cancelled" && <ProgressBar status={o.status} />}

                  <ul className="mt-4 divide-y text-sm" style={{ borderColor: "var(--glo-border)" }}>
                    {o.items?.map((it, i) => (
                      <li key={i} className="py-2 flex justify-between">
                        <span style={{ color: "var(--glo-text-2)" }}>
                          <ShoppingBag size={13} className="inline mr-1" />
                          {it.quantity} × {it.size_kg}kg bag
                        </span>
                        <span style={{ color: "var(--glo-text)" }}>{formatMWK(it.line_total_mwk)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex justify-between items-baseline pt-3 mt-1" style={{ borderTop: "1px solid var(--glo-border)" }}>
                    <span className="text-sm" style={{ color: "var(--glo-text-2)" }}>Total</span>
                    <span className="font-display text-2xl" style={{ color: "var(--glo-green)" }}>{formatMWK(o.total_mwk)}</span>
                  </div>

                  <p className="text-xs mt-2" style={{ color: "var(--glo-text-3)" }}>
                    Ordered {new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    {" · "}{o.address_details}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
