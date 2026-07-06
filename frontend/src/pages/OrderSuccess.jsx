import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, MessageCircle, ShoppingBag } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { formatMWK, buildWhatsappLink } from "../lib/api";

export default function OrderSuccess() {
  const { state } = useLocation();
  const order = state?.order;

  return (
    <div style={{ background: "var(--glo-cream)", minHeight: "100vh" }}>
      <Navbar />
      <section className="section">
        <div className="container-glo max-w-3xl">
          <div className="card-solution text-center" data-testid="order-success-card">
            <div className="mx-auto icon-tile icon-tile-green" style={{ width: "4rem", height: "4rem", borderRadius: "1.25rem" }}>
              <CheckCircle2 size={28} />
            </div>
            <h1 className="font-display text-4xl mt-6" style={{ color: "var(--glo-text)" }}>
              Order received <span className="italic-green">successfully.</span>
            </h1>
            <p className="mt-3" style={{ color: "var(--glo-text-2)" }}>
              Thank you{order?.customer_name ? `, ${order.customer_name}` : ""}! Our team will call you shortly to confirm your delivery.
            </p>

            {order && (
              <div className="mt-8 text-left rounded-2xl p-5" style={{ background: "var(--glo-cream-2)" }} data-testid="order-success-details">
                <p className="text-xs uppercase tracking-widest" style={{ color: "var(--glo-text-3)" }}>Order ID</p>
                <p className="font-mono text-sm" style={{ color: "var(--glo-text)" }}>{order.id}</p>

                <ul className="mt-4 divide-y" style={{ borderColor: "var(--glo-border)" }}>
                  {order.items?.map((it, idx) => (
                    <li key={idx} className="py-2 flex justify-between text-sm">
                      <span style={{ color: "var(--glo-text-2)" }}>{it.quantity} × {it.size_kg}kg bag</span>
                      <span className="font-semibold">{formatMWK(it.line_total_mwk)}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex justify-between items-baseline pt-3 mt-3" style={{ borderTop: "1px solid var(--glo-border)" }}>
                  <span className="text-sm" style={{ color: "var(--glo-text-2)" }}>Total</span>
                  <span className="font-display text-2xl" style={{ color: "var(--glo-green)" }}>{formatMWK(order.total_mwk)}</span>
                </div>
                <p className="text-xs mt-3" style={{ color: "var(--glo-text-3)" }}>
                  Delivery to {order.location} — {order.address_details}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={buildWhatsappLink(`Hello GLO Venture, I just placed an order${order ? ` (#${order.id.slice(0, 8)})` : ""}.`)}
                target="_blank"
                rel="noreferrer"
                className="btn-whatsapp"
                data-testid="success-whatsapp"
              >
                <MessageCircle size={18} /> Confirm on WhatsApp
              </a>
              <Link to="/" className="btn-secondary" data-testid="success-home">
                <ShoppingBag size={18} /> Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
