import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, MessageCircle, ShoppingBag, ShieldCheck, Truck, Wallet } from "lucide-react";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api, { formatMWK, buildWhatsappLink } from "../lib/api";

export default function Order() {
  const [products, setProducts] = useState([]);
  const [qty, setQty] = useState({});
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    location: "Dowa",
    address_details: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/products").then((r) => {
      setProducts(r.data);
      const seed = {};
      const pre = params.get("product");
      r.data.forEach((p) => {
        seed[p.id] = pre === p.id ? 1 : 0;
      });
      setQty(seed);
    });
  }, [params]);

  const inc = (id) => setQty((q) => ({ ...q, [id]: (q[id] || 0) + 1 }));
  const dec = (id) => setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] || 0) - 1) }));

  const items = useMemo(
    () => products.filter((p) => (qty[p.id] || 0) > 0).map((p) => ({ ...p, quantity: qty[p.id] })),
    [products, qty]
  );
  const total = items.reduce((acc, it) => acc + it.price_mwk * it.quantity, 0);

  const buildMsg = () => {
    let msg = `Hello GLO Venture! I'd like to place an order:%0A%0A`.replace(/%0A/g, "\n");
    items.forEach((it) => {
      msg += `• ${it.quantity} × ${it.size_kg}kg bag — ${formatMWK(it.price_mwk * it.quantity)}\n`;
    });
    msg += `\nTotal: ${formatMWK(total)}\n\n`;
    msg += `Name: ${form.customer_name}\nPhone: ${form.phone}\nLocation: ${form.location}\nAddress: ${form.address_details}\n`;
    if (form.notes) msg += `Notes: ${form.notes}\n`;
    return msg;
  };

  const validate = () => {
    if (items.length === 0) return "Please select at least one bag.";
    if (form.customer_name.trim().length < 2) return "Please enter your name.";
    if (form.phone.trim().length < 6) return "Please enter a valid phone number.";
    if (form.address_details.trim().length < 3) return "Please enter your delivery address.";
    return null;
  };

  const submitOnline = async () => {
    const err = validate();
    if (err) return toast.error(err);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        items: items.map((it) => ({ product_id: it.id, quantity: it.quantity })),
      };
      const { data } = await api.post("/orders", payload);
      toast.success("Order placed! We will call you shortly to confirm.");
      navigate("/order/success", { state: { order: data } });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not place the order. Please try WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitWhatsapp = async () => {
    const err = validate();
    if (err) return toast.error(err);
    // also save to DB so admin sees it
    try {
      const payload = {
        ...form,
        items: items.map((it) => ({ product_id: it.id, quantity: it.quantity })),
        notes: (form.notes ? form.notes + " | " : "") + "Sent via WhatsApp",
      };
      await api.post("/orders", payload);
    } catch (err) {
      // non-blocking — proceed with WhatsApp anyway, but surface the failure
      console.warn("WhatsApp order persist failed; opening wa.me anyway:", err);
    }
    window.open(buildWhatsappLink(buildMsg()), "_blank");
  };

  return (
    <div style={{ background: "var(--glo-cream)", minHeight: "100vh" }}>
      <Navbar />

      <section className="section">
        <div className="container-glo">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 text-sm" style={{ color: "var(--glo-text-2)" }} data-testid="order-back-home">
            <ArrowLeft size={16} /> Back to home
          </Link>

          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7">
              <p className="eyebrow mb-3">Order rice</p>
              <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]" style={{ color: "var(--glo-text)" }}>
                Build your <span className="italic-green">order</span>.
              </h1>
              <p className="mt-3" style={{ color: "var(--glo-text-2)" }}>
                Pick your bags, share your details. Pay on delivery — honest weight at your doorstep.
              </p>

              <div className="mt-8 grid gap-4">
                {products.map((p) => (
                  <div key={p.id} className="card-solution flex flex-col sm:flex-row sm:items-center gap-4" data-testid={`order-product-${p.id}`}>
                    <div className="icon-tile icon-tile-ochre"><ShoppingBag size={20} /></div>
                    <div className="flex-1">
                      <h3 className="font-display text-xl" style={{ color: "var(--glo-text)" }}>{p.size_kg} kg bag</h3>
                      <p className="text-sm" style={{ color: "var(--glo-text-2)" }}>{p.description}</p>
                      <p className="font-display text-lg mt-1" style={{ color: "var(--glo-green)" }}>{formatMWK(p.price_mwk)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => dec(p.id)}
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: "var(--glo-green-soft)", color: "var(--glo-green)" }}
                        data-testid={`qty-dec-${p.id}`}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-display text-xl w-8 text-center" data-testid={`qty-${p.id}`}>{qty[p.id] || 0}</span>
                      <button
                        type="button"
                        onClick={() => inc(p.id)}
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: "var(--glo-green)", color: "#fff" }}
                        data-testid={`qty-inc-${p.id}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm" style={{ color: "var(--glo-text-2)" }}>Full Name</label>
                  <input
                    className="glo-input mt-1"
                    placeholder="Your name"
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    data-testid="order-input-name"
                  />
                </div>
                <div>
                  <label className="text-sm" style={{ color: "var(--glo-text-2)" }}>Phone Number</label>
                  <input
                    className="glo-input mt-1"
                    placeholder="+265 ..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    data-testid="order-input-phone"
                  />
                </div>
                <div>
                  <label className="text-sm" style={{ color: "var(--glo-text-2)" }}>Delivery Area</label>
                  <select
                    className="glo-input mt-1"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    data-testid="order-select-location"
                  >
                    <option>Dowa</option>
                    <option>Dzaleka</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm" style={{ color: "var(--glo-text-2)" }}>Address Details</label>
                  <input
                    className="glo-input mt-1"
                    placeholder="Village / landmark / house description"
                    value={form.address_details}
                    onChange={(e) => setForm({ ...form, address_details: e.target.value })}
                    data-testid="order-input-address"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm" style={{ color: "var(--glo-text-2)" }}>Notes (optional)</label>
                  <textarea
                    className="glo-input mt-1"
                    rows={3}
                    placeholder="Anything we should know?"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    data-testid="order-input-notes"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="card-solution sticky top-28" data-testid="order-summary">
                <h3 className="font-display text-2xl" style={{ color: "var(--glo-text)" }}>Your order</h3>

                {items.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--glo-text-3)" }}>
                    No bags selected yet. Add a bag to see the total.
                  </p>
                ) : (
                  <ul className="divide-y" style={{ borderColor: "var(--glo-border)" }}>
                    {items.map((it) => (
                      <li key={it.id} className="py-3 flex justify-between text-sm">
                        <span style={{ color: "var(--glo-text-2)" }}>{it.quantity} × {it.size_kg}kg bag</span>
                        <span className="font-semibold" style={{ color: "var(--glo-text)" }}>{formatMWK(it.price_mwk * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex justify-between items-baseline pt-3" style={{ borderTop: "1px solid var(--glo-border)" }}>
                  <span className="text-sm" style={{ color: "var(--glo-text-2)" }}>Total</span>
                  <span className="font-display text-3xl" style={{ color: "var(--glo-green)" }} data-testid="order-total">{formatMWK(total)}</span>
                </div>

                <div className="grid gap-3 pt-2">
                  <button
                    onClick={submitOnline}
                    disabled={submitting}
                    className="btn-primary"
                    data-testid="order-submit-online"
                  >
                    <ShoppingBag size={18} /> {submitting ? "Placing..." : "Place Order"}
                  </button>
                  <button
                    onClick={submitWhatsapp}
                    className="btn-whatsapp"
                    data-testid="order-submit-whatsapp"
                  >
                    <MessageCircle size={18} /> Order via WhatsApp
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 text-xs" style={{ color: "var(--glo-text-3)" }}>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <ShieldCheck size={16} color="var(--glo-green)" /> Honest weight
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <Truck size={16} color="var(--glo-green)" /> Same-day
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <Wallet size={16} color="var(--glo-green)" /> Pay on delivery
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
