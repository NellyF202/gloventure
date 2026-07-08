import { useEffect, useRef, useState } from "react";
import { MessageCircle, ChevronDown, Copy, Check } from "lucide-react";
import { buildWhatsappLink, formatMWK } from "../lib/api";

const buildTemplates = (order) => {
  const name = order.customer_name;
  const ref = `#${order.id.slice(0, 8)}`;
  const total = formatMWK(order.total_mwk);
  const items = (order.items || [])
    .map((it) => `• ${it.quantity} × ${it.size_kg}kg bag`)
    .join("\n");
  const address = order.address_details;

  return [
    {
      label: "✅ Order Confirmed",
      key: "confirmed",
      message:
        `Hello ${name}! 🌾 Your GLO Venture order ${ref} has been *confirmed*.\n\n` +
        `${items}\n*Total: ${total}*\n\n` +
        `We are preparing your rice and will dispatch soon. We'll notify you when it's on the way. Thank you! 🙏`,
    },
    {
      label: "🛵 Out for Delivery",
      key: "out_for_delivery",
      message:
        `Hello ${name}! Your GLO Venture order ${ref} is now *out for delivery* 🛵\n\n` +
        `Our rider is heading to: *${address}*\n` +
        `Please have *${total}* ready — pay on delivery.\n\n` +
        `They will arrive shortly. Thank you for choosing GLO Venture! 🌾`,
    },
    {
      label: "🎉 Delivered — Thank You",
      key: "delivered",
      message:
        `Hello ${name}! 🎉 Your GLO Venture order ${ref} has been *delivered*.\n\n` +
        `Thank you so much for your purchase! We hope you enjoy your premium Malawian rice. 🌾\n\n` +
        `Please don't hesitate to order again — we're always here. Have a wonderful day! 😊`,
    },
    {
      label: "💰 Payment Reminder",
      key: "payment",
      message:
        `Hello ${name}! A friendly reminder from GLO Venture 🌾\n\n` +
        `Your order ${ref} is on its way. Please have *${total}* ready in cash for our rider. We only accept cash on delivery.\n\n` +
        `Thank you for your understanding!`,
    },
    {
      label: "⏳ Small Delay Notice",
      key: "delay",
      message:
        `Hello ${name}, this is GLO Venture regarding your order ${ref}.\n\n` +
        `We sincerely apologize — there is a slight delay with your delivery today. Our rider will reach you as soon as possible.\n\n` +
        `Thank you for your patience! We appreciate your trust. 🙏`,
    },
    {
      label: "❌ Order Cancelled",
      key: "cancelled",
      message:
        `Hello ${name}, we're sorry to inform you that your GLO Venture order ${ref} has been *cancelled*.\n\n` +
        `If you did not request this cancellation or if you'd like to place a new order, please reply to this message or call us.\n\n` +
        `We apologize for any inconvenience. 🙏`,
    },
  ];
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy message text"
      style={{
        flexShrink: 0,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "4px",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        color: copied ? "var(--glo-green)" : "var(--glo-text-3)",
        transition: "color 0.15s",
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export default function WhatsAppTemplates({ order }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const templates = buildTemplates(order);

  const STATUS_SUGGESTIONS = {
    pending: ["confirmed", "delay"],
    confirmed: ["out_for_delivery", "payment", "delay"],
    out_for_delivery: ["delivered", "payment", "delay"],
    delivered: ["delivered"],
    cancelled: ["cancelled"],
  };

  const suggested = STATUS_SUGGESTIONS[order.status] || [];
  const sorted = [
    ...templates.filter((t) => suggested.includes(t.key)),
    ...templates.filter((t) => !suggested.includes(t.key)),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-whatsapp inline-flex items-center gap-2"
        data-testid={`order-whatsapp-${order.id}`}
      >
        <MessageCircle size={16} />
        WhatsApp
        <ChevronDown
          size={14}
          style={{
            opacity: 0.8,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 rounded-2xl shadow-xl overflow-hidden"
          style={{
            minWidth: "260px",
            right: 0,
            background: "#fff",
            border: "1px solid var(--glo-border)",
          }}
          data-testid={`wa-template-menu-${order.id}`}
        >
          <div
            className="px-4 py-2.5 text-xs font-semibold uppercase tracking-widest"
            style={{
              color: "var(--glo-text-3)",
              borderBottom: "1px solid var(--glo-border)",
            }}
          >
            Send message to {order.customer_name.split(" ")[0]}
          </div>

          {sorted.map((tpl) => {
            const isSuggested = suggested.includes(tpl.key);
            return (
              <div
                key={tpl.key}
                style={{
                  borderBottom: "1px solid var(--glo-border)",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--glo-cream)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <a
                  href={buildWhatsappLink(tpl.message)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 8px 10px 16px",
                    color: "var(--glo-text)",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    fontWeight: isSuggested ? "600" : "400",
                  }}
                  data-testid={`wa-tpl-${tpl.key}-${order.id}`}
                >
                  <span style={{ flex: 1 }}>{tpl.label}</span>
                  {isSuggested && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background: "var(--glo-green-soft)",
                        color: "var(--glo-green)",
                        flexShrink: 0,
                      }}
                    >
                      suggested
                    </span>
                  )}
                </a>
                <div style={{ paddingRight: "12px" }}>
                  <CopyButton text={tpl.message} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
