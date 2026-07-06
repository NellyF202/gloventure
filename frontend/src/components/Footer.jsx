import { Mail, Phone, Linkedin, MessageCircle, MapPin } from "lucide-react";
import { buildWhatsappLink } from "../lib/api";

export const Footer = () => {
  return (
    <footer
      id="contact"
      className="section"
      style={{ background: "var(--glo-green)", color: "var(--glo-cream)" }}
      data-testid="main-footer"
    >
      <div className="container-glo">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-display text-lg"
                style={{ background: "var(--glo-ochre)" }}
              >
                G
              </div>
              <span className="font-display text-2xl">
                GLO <span style={{ color: "var(--glo-ochre)", fontStyle: "italic" }}>Venture</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(250,243,236,0.8)" }}>
              Premium Malawian rice, delivered honestly. Every bag helps keep girls in school.
            </p>
          </div>

          <div>
            <h4 className="font-display text-xl mb-4">Visit / Serve</h4>
            <ul className="space-y-3 text-sm" style={{ color: "rgba(250,243,236,0.85)" }}>
              <li className="flex items-start gap-3"><MapPin size={18} /> Dowa District, Central Region, Malawi</li>
              <li className="flex items-start gap-3"><MapPin size={18} /> Dzaleka Refugee Camp</li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-xl mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="tel:+265886750499" className="flex items-center gap-3 hover:underline" data-testid="footer-phone">
                  <Phone size={18} /> +265 886 750 499
                </a>
              </li>
              <li>
                <a href="mailto:Nellyhapp12@gmail.com" className="flex items-center gap-3 hover:underline" data-testid="footer-email">
                  <Mail size={18} /> Nellyhapp12@gmail.com
                </a>
              </li>
              <li>
                <a
                  href={buildWhatsappLink("Hello GLO Venture, I would like to order rice.")}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 hover:underline"
                  data-testid="footer-whatsapp"
                >
                  <MessageCircle size={18} /> Chat on WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/glo-venture-retail-rice-delivery/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 hover:underline"
                  data-testid="footer-linkedin"
                >
                  <Linkedin size={18} /> LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 text-xs flex flex-col md:flex-row justify-between gap-2" style={{ borderTop: "1px solid rgba(250,243,236,0.18)", color: "rgba(250,243,236,0.6)" }}>
          <span>© {new Date().getFullYear()} GLO Venture — Retail Rice Delivery. All rights reserved.</span>
          <span>Feeding Communities → Sending Girls to School</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
