import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  ShoppingBag,
  Truck,
  Scale,
  MapPin,
  Sparkles,
  Bike,
  MessageCircle,
  Award,
  Check,
  Phone,
  Wallet,
  Clock,
  ArrowDown,
  Users,
  Quote,
  ShieldCheck,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api, { formatMWK, buildWhatsappLink } from "../lib/api";

const HERO_IMG =
  "https://static.prod-images.emergentagent.com/jobs/5ae037a9-9343-43c8-a202-30c3ae3a5420/images/c72b442d816423b7396624cd1dcf91a1b9a1c34743f13f0a45fc029ec29dff6d.png";
const DELIVERY_IMG =
  "https://static.prod-images.emergentagent.com/jobs/5ae037a9-9343-43c8-a202-30c3ae3a5420/images/5cbed1cdebd06e2c64e3d06a4d7811ff324ed41c40ab7a13864b226e97007956.png";
const COMMUNITY_IMG =
  "https://images.unsplash.com/photo-1768814667300-8c9e2007b949?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY29tbXVuaXR5JTIwd29tZW58ZW58MHx8fHwxNzc3NzI0OTI4fDA&ixlib=rb-4.1.0&q=85";

const PROBLEMS = [
  {
    icon: MapPin,
    title: "Long Distances",
    desc: "Families walk kilometres carrying heavy 25–50 kg bags, losing hours that could be spent on work or school.",
  },
  {
    icon: Scale,
    title: "Dishonest Scales",
    desc: "Short-weighing and rigged scales at open markets cheat families out of rice they already paid for.",
  },
  {
    icon: Sparkles,
    title: "Poor Quality",
    desc: "Open-market rice is often dirty, full of stones, and poorly milled — a health risk for families.",
  },
  {
    icon: Wallet,
    title: "High Transport Cost",
    desc: "Transport fares to and from the market eat into already limited household budgets.",
  },
  {
    icon: GraduationCap,
    title: "Girls Out of School",
    desc: "Daily food trips steal time and safety from women and girls — and pull them out of the classroom.",
  },
];

const SOLUTIONS = [
  { icon: MessageCircle, title: "Order Easily", desc: "WhatsApp, SMS, or a simple phone call — no app required.", tile: "icon-tile-green" },
  { icon: Award,         title: "Premium Rice", desc: "Cleaned, stone-free, honestly milled. Quality you can trust.", tile: "icon-tile-ochre" },
  { icon: Scale,         title: "Fair & Honest", desc: "Full weight, stable prices. No tricks, no short-weighing.", tile: "icon-tile-coral" },
  { icon: Bike,          title: "Fast Delivery", desc: "Motorbike delivery straight to your doorstep in hours.", tile: "icon-tile-green" },
];

const STEPS = [
  { n: "01", icon: ShoppingBag, title: "Choose your bag", desc: "Pick a 5kg, 25kg or 50kg bag of GLO Premium Rice." },
  { n: "02", icon: MessageCircle, title: "Send your order", desc: "Order via WhatsApp, SMS or our simple online form." },
  { n: "03", icon: Bike, title: "Motorbike delivery", desc: "We confirm and dispatch a motorbike straight to your door." },
  { n: "04", icon: Wallet, title: "Pay on delivery", desc: "Honest weight at your doorstep. Pay only when it arrives." },
];

const STATS = [
  { value: "1,000+ kg", label: "Rice delivered in 6-month pilot" },
  { value: "0", label: "Failed deliveries" },
  { value: "90%", label: "Customers switched from open market" },
  { value: "50,000+", label: "People in Dowa & Dzaleka served daily" },
];

import teamJospin from "../assets/team-jospin.jpg";
import teamNelly from "../assets/team-nelly.jpg";
import teamJoseph from "../assets/team-joseph.jpg";

const TEAM = [
  {
    name: "Jospin Amissi Hassan",
    role: "Logistics Manager",
    bio: "Keeps every delivery fast, reliable, and on time.",
    photo: teamJospin,
  },
  {
    name: "Nelly Furaha Kininga",
    role: "Founder & CEO",
    bio: "Community-rooted leader, operations & strategy expert.",
    photo: teamNelly,
  },
  {
    name: "Joseph Abednego Shabani",
    role: "Sales Lead",
    bio: "Business relationships & bulk buyer management.",
    photo: teamJoseph,
  },
];
const TESTIMONIALS = [
  {
    name: "Grace Banda",
    location: "Dowa Town",
    stars: 5,
    quote: "Before GLO Venture I used to walk 2 hours to the market every week. Now the rice comes to my door and it is always clean — no stones at all!",
  },
  {
    name: "Aisha Tembo",
    location: "Dzaleka Camp",
    stars: 5,
    quote: "I ordered 10 kg bags for my family. The delivery was fast and the rice was exactly as weighed. I trust GLO Venture completely.",
  },
  {
    name: "Chisomo Phiri",
    location: "Dowa District",
    stars: 5,
    quote: "The price is fair and the service is professional. I got a WhatsApp message when my order was on the way. Very impressed!",
  },
  {
    name: "Fatuma Rashidi",
    location: "Dzaleka Camp",
    stars: 5,
    quote: "As a mother of six, carrying heavy rice bags from town was so hard. GLO Venture brings it right to me. My children are happy and I save so much time.",
  },
  {
    name: "Emmanuel Chikwanda",
    location: "Dowa Town",
    stars: 4,
    quote: "Good quality rice. The rider was polite and on time. I will keep ordering every month.",
  },
  {
    name: "Mary Nkhata",
    location: "Dzaleka Camp",
    stars: 5,
    quote: "I told all my neighbors about GLO Venture. We now do a group order every two weeks. The bulk discount is wonderful!",
  },
];

export default function Landing() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get("/products").then((r) => setProducts(r.data)).catch(() => {});
    if (window.location.hash) {
      const id = window.location.hash.replace("#", "");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }
  }, []);

  return (
    <div style={{ background: "var(--glo-cream)" }}>
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden" data-testid="hero-section">
        <div className="container-glo pt-12 pb-16 lg:pt-20 lg:pb-24 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 animate-fade-up">
            <div className="glo-badge mb-6" data-testid="hero-badge">
              <GraduationCap size={16} color="var(--glo-ochre)" />
              <span>Every bag helps keep girls in school</span>
            </div>
            <h1
              className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight"
              style={{ color: "var(--glo-text)" }}
              data-testid="hero-headline"
            >
              Premium Malawian Rice,
              <br />
              <span className="italic-green">Delivered</span> to Your Door
            </h1>
            <p
              className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed"
              style={{ color: "var(--glo-text-2)" }}
            >
              Stone-free, honestly weighed rice delivered by motorbike to families in
              Dowa and Dzaleka. Saving women hours of travel — one bag at a time.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/order" className="btn-primary" data-testid="hero-cta-order">
                <Truck size={18} /> Order Rice Today
              </Link>
              <button
                onClick={() => document.getElementById("mission")?.scrollIntoView({ behavior: "smooth" })}
                className="btn-secondary"
                data-testid="hero-cta-mission"
              >
                Our Mission
              </button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm" style={{ color: "var(--glo-text-3)" }}>
              <span className="flex items-center gap-2"><ShieldCheck size={16} color="var(--glo-green)" /> Honest Weights</span>
              <span className="flex items-center gap-2"><Truck size={16} color="var(--glo-green)" /> Same-Day Delivery</span>
              <span className="flex items-center gap-2"><GraduationCap size={16} color="var(--glo-green)" /> Girls' Education</span>
            </div>
          </div>

          <div className="lg:col-span-5 animate-fade-up">
            <div className="relative">
              <div
                className="absolute -inset-3 rounded-[2rem] -z-0"
                style={{ background: "var(--glo-ochre-soft)" }}
              />
              <img
                src={HERO_IMG}
                alt="Premium GLO Venture rice"
                className="relative rounded-[1.75rem] w-full object-cover h-[420px] lg:h-[520px] shadow-[0_30px_60px_-30px_rgba(31,92,58,0.5)]"
                data-testid="hero-image"
              />
              <div
                className="hidden md:flex absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 gap-3 items-center shadow-xl"
                style={{ border: "1px solid var(--glo-border)" }}
              >
                <div className="icon-tile icon-tile-green"><Bike size={20} /></div>
                <div>
                  <p className="text-xs" style={{ color: "var(--glo-text-3)" }}>Same-day arrival</p>
                  <p className="font-display text-base" style={{ color: "var(--glo-text)" }}>Motorbike delivery</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center pb-8">
          <ArrowDown size={20} color="var(--glo-text-3)" className="animate-bounce" />
        </div>
      </section>

      {/* PROBLEM */}
      <section className="section" data-testid="problem-section">
        <div className="container-glo">
          <div className="max-w-3xl mb-12">
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05]" style={{ color: "var(--glo-text)" }}>
              Families deserve better than the open market
            </h2>
            <p className="mt-5 text-lg leading-relaxed" style={{ color: "var(--glo-text-2)" }}>
              In Dowa and Dzaleka, buying rice shouldn't mean risking your safety, your budget, or your daughter's education.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="card-problem" data-testid={`problem-card-${p.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="icon-tile icon-tile-coral"><p.icon size={20} /></div>
                <h3 className="font-display text-2xl" style={{ color: "var(--glo-text)" }}>{p.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--glo-text-2)" }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="section" id="how" style={{ background: "var(--glo-cream-2)" }} data-testid="solution-section">
        <div className="container-glo grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
            <p className="eyebrow mb-5">Our Solution</p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05]" style={{ color: "var(--glo-text)" }}>
              Rice delivered right.
              <br />
              <span className="italic-green">Every time.</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed max-w-xl" style={{ color: "var(--glo-text-2)" }}>
              We're not selling rice for the sake of selling rice. We're building reliable food access so more girls can stay in school.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                "Fast motorbike delivery — arrives in hours",
                "Premium, cleaned, branded rice — no stones, no dirt",
                "Honest weights & fair, stable prices — full trust",
                "Social mission built in — every bag supports education",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3" style={{ color: "var(--glo-text-2)" }}>
                  <span className="icon-tile icon-tile-green" style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.6rem", flexShrink: 0 }}>
                    <Check size={14} />
                  </span>
                  <span className="text-sm pt-0.5">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {SOLUTIONS.map((s) => (
              <div key={s.title} className="card-solution" data-testid={`solution-card-${s.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className={`icon-tile ${s.tile}`}><s.icon size={20} /></div>
                <h3 className="font-display text-xl" style={{ color: "var(--glo-text)" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--glo-text-2)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="section" id="mission" data-testid="mission-section">
        <div className="container-glo grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <img
              src={COMMUNITY_IMG}
              alt="Women in our community"
              className="rounded-[1.75rem] w-full h-[420px] object-cover shadow-[0_30px_60px_-30px_rgba(31,92,58,0.45)]"
              data-testid="mission-image"
            />
          </div>
          <div className="lg:col-span-7">
            <p className="eyebrow mb-5">Our Mission</p>
            <h2 className="font-display text-4xl sm:text-5xl leading-[1.1]" style={{ color: "var(--glo-text)" }}>
              Feeding communities. <br /><span className="italic-green">Sending girls to school.</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed" style={{ color: "var(--glo-text-2)" }}>
              GLO Venture is a retail social enterprise delivering high-quality Malawian rice
              directly to families in Dowa and Dzaleka. By saving women hours of travel and
              reducing food costs for refugee and rural households, we keep more girls in
              the classroom — and create sustainable economic pathways for marginalized
              women and youth.
            </p>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-2xl p-5" style={{ background: "var(--glo-green-soft)" }} data-testid={`stat-${s.label.split(" ")[0].toLowerCase()}`}>
                  <div className="font-display text-3xl" style={{ color: "var(--glo-green)" }}>{s.value}</div>
                  <div className="text-xs mt-2" style={{ color: "var(--glo-text-2)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" style={{ background: "var(--glo-cream-2)" }} data-testid="how-section">
        <div className="container-glo">
          <div className="max-w-2xl mb-12">
            <p className="eyebrow mb-4">How It Works</p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05]" style={{ color: "var(--glo-text)" }}>
              From order to <span className="italic-green">doorstep</span> in hours.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s) => (
              <div key={s.n} className="card-solution" data-testid={`step-${s.n}`}>
                <div className="flex items-center justify-between">
                  <div className="icon-tile icon-tile-green"><s.icon size={18} /></div>
                  <span className="font-display text-3xl" style={{ color: "var(--glo-ochre)" }}>{s.n}</span>
                </div>
                <h3 className="font-display text-xl mt-2" style={{ color: "var(--glo-text)" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--glo-text-2)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/order" className="btn-primary" data-testid="how-cta-order">
              <ShoppingBag size={18} /> Place Your Order
            </Link>
            <a
              href={buildWhatsappLink("Hello GLO Venture, I'd like to order rice. Please share details.")}
              target="_blank"
              rel="noreferrer"
              className="btn-whatsapp"
              data-testid="how-cta-whatsapp"
            >
              <MessageCircle size={18} /> WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="section" id="products" data-testid="products-section">
        <div className="container-glo">
          <div className="max-w-2xl mb-12">
            <p className="eyebrow mb-4">Our Catalogue</p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05]" style={{ color: "var(--glo-text)" }}>
              Honest bags. <span className="italic-green">Honest prices.</span>
            </h2>
            <p className="mt-4 text-base" style={{ color: "var(--glo-text-2)" }}>
              All prices in MWK. Pay on delivery. Same-day motorbike service in Dowa & Dzaleka.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {products.map((p, i) => (
              {(Array.isArray(products) ? products : []).map((p, i) => (
              <div
                key={p.id}
                className="card-solution relative"
                data-testid={`product-card-${p.id}`}
                style={{ borderColor: i === 1 ? "var(--glo-green)" : "var(--glo-border)" }}
              >
                {p.badge && (
                  <span
                    className="absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "var(--glo-ochre)", color: "#fff" }}
                  >
                    {p.badge}
                  </span>
                )}
                <div className="icon-tile icon-tile-ochre"><ShoppingBag size={20} /></div>
                <h3 className="font-display text-2xl" style={{ color: "var(--glo-text)" }}>{p.size_kg} kg Bag</h3>
                <p className="text-sm" style={{ color: "var(--glo-text-2)" }}>{p.description}</p>
                <div className="font-display text-3xl mt-2" style={{ color: "var(--glo-green)" }}>
                  {formatMWK(p.price_mwk)}
                </div>
                <Link to={`/order?product=${p.id}`} className="btn-primary mt-2 justify-center" data-testid={`product-order-${p.id}`}>
                  Order this bag
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACT / TRACTION */}
      <section className="section" id="impact" style={{ background: "var(--glo-green)", color: "var(--glo-cream)" }} data-testid="impact-section">
        <div className="container-glo grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-4" style={{ color: "var(--glo-ochre)" }}>Proven Traction</p>
            <h2 className="font-display text-4xl sm:text-5xl leading-[1.05]">
              6-month pilot. <span style={{ color: "var(--glo-ochre)", fontStyle: "italic" }}>Real results.</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed" style={{ color: "rgba(250,243,236,0.85)" }}>
              We started with one motorbike and a handful of families. Today, repeat customers and growing word-of-mouth demand prove that families want a better way to buy rice.
            </p>

            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.08)" }}>
                <Users size={20} color="var(--glo-ochre)" />
                <div className="font-display text-3xl mt-3">90%</div>
                <p className="text-xs mt-1" style={{ color: "rgba(250,243,236,0.8)" }}>Switched from open market</p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.08)" }}>
                <Truck size={20} color="var(--glo-ochre)" />
                <div className="font-display text-3xl mt-3">1,000+</div>
                <p className="text-xs mt-1" style={{ color: "rgba(250,243,236,0.8)" }}>kg delivered in pilot</p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.08)" }}>
                <Clock size={20} color="var(--glo-ochre)" />
                <div className="font-display text-3xl mt-3">0</div>
                <p className="text-xs mt-1" style={{ color: "rgba(250,243,236,0.8)" }}>failed deliveries</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-[1.75rem] overflow-hidden" style={{ border: "1px solid rgba(250,243,236,0.15)" }}>
              <img src={DELIVERY_IMG} alt="Motorbike delivery" className="w-full h-[360px] object-cover" data-testid="impact-image" />
            </div>
            <div className="mt-6 rounded-2xl p-5 flex gap-4" style={{ background: "rgba(255,255,255,0.06)" }}>
              <Quote size={28} color="var(--glo-ochre)" />
              <div>
                <p className="font-display text-lg italic" style={{ color: "var(--glo-cream)" }}>
                  "I no longer walk for hours with a 25 kg bag. The rice arrives clean, full-weight, right at my door."
                </p>
                <p className="mt-2 text-xs" style={{ color: "rgba(250,243,236,0.7)" }}>— A repeat customer in Dowa</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="section" data-testid="team-section">
        <div className="container-glo">
          <div className="max-w-2xl mb-12">
            <p className="eyebrow mb-4">The Team</p>
            <h2 className="font-display text-4xl sm:text-5xl leading-[1.05]" style={{ color: "var(--glo-text)" }}>
              Small. Committed. <span className="italic-green">Capable.</span>
            </h2>
            <p className="mt-4" style={{ color: "var(--glo-text-2)" }}>
              Deep local knowledge and strong execution — built by leaders rooted in the communities we serve.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TEAM.map((m) => (
              <div key={m.name} className="card-solution items-start" data-testid={`team-${m.name}`}>
                <img
                  src={m.photo}
                  alt={m.name}
                  className="w-20 h-20 rounded-full object-cover object-top"
                  style={{ border: "3px solid var(--glo-green-soft)" }}
                />
                <h3 className="font-display text-2xl mt-3" style={{ color: "var(--glo-text)" }}>{m.name}</h3>
                <p className="text-sm font-semibold" style={{ color: "var(--glo-ochre)" }}>{m.role}</p>
                <p className="text-sm" style={{ color: "var(--glo-text-2)" }}>{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" style={{ background: "var(--glo-cream-2)" }} data-testid="testimonials-section">
        <div className="container-glo">
          <div className="max-w-2xl mb-12">
            <p className="eyebrow mb-4">Customer Reviews</p>
            <h2 className="font-display text-4xl sm:text-5xl leading-[1.05]" style={{ color: "var(--glo-text)" }}>
              What our <span className="italic-green">customers say.</span>
            </h2>
            <p className="mt-4" style={{ color: "var(--glo-text-2)" }}>
              Real feedback from families in Dowa and Dzaleka who receive GLO Venture rice at their doorstep.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card-solution flex flex-col gap-3" data-testid={`testimonial-${i}`}>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <svg key={s} width="16" height="16" viewBox="0 0 20 20" fill={s < t.stars ? "var(--glo-ochre)" : "none"} stroke="var(--glo-ochre)" strokeWidth="1.5">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--glo-text-2)" }}>"{t.quote}"</p>
                <div className="flex items-center gap-3 mt-2">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "var(--glo-green-soft)", color: "var(--glo-green)" }}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--glo-text)" }}>{t.name}</p>
                    <p className="text-xs" style={{ color: "var(--glo-text-3)" }}>{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* FINAL CTA */}
      <section className="section" style={{ background: "var(--glo-cream-2)" }}>
        <div className="container-glo">
          <div
            className="rounded-[2rem] p-10 lg:p-16 grid lg:grid-cols-2 gap-10 items-center"
            style={{ background: "var(--glo-terracotta)" }}
          >
            <div>
              <h2 className="font-display text-4xl lg:text-5xl leading-[1.05]" style={{ color: "var(--glo-text)" }}>
                Ready for rice you can <span className="italic-green">trust?</span>
              </h2>
              <p className="mt-4" style={{ color: "var(--glo-text-2)" }}>
                Place your order in under 2 minutes — by web or WhatsApp. We'll bring it to your door, full-weight, every time.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 lg:justify-end">
              <Link to="/order" className="btn-primary" data-testid="cta-final-order">
                <ShoppingBag size={18} /> Order Online
              </Link>
              <a
                href={buildWhatsappLink("Hello GLO Venture, I'd like to order rice. Please share details.")}
                target="_blank"
                rel="noreferrer"
                className="btn-whatsapp"
                data-testid="cta-final-whatsapp"
              >
                <MessageCircle size={18} /> WhatsApp Order
              </a>
              <a href="tel:+265886750499" className="btn-secondary" data-testid="cta-final-call">
                <Phone size={18} /> Call Us
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
