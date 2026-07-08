import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, X, PackageSearch } from "lucide-react";
import { useState } from "react";
import logo from "../assets/logo.png";

export const Navbar = () => {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const scrollTo = (id) => {
    setOpen(false);
    if (window.location.pathname !== "/") {
      nav("/#" + id);
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{ background: "rgba(250,243,236,0.85)", borderBottom: "1px solid var(--glo-border)" }}
      data-testid="main-navbar"
    >
      <div className="container-glo flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3" data-testid="nav-logo">
          <img src={logo} alt="GLO Venture" className="h-10 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollTo("mission")} className="nav-link" data-testid="nav-mission">Mission</button>
          <button onClick={() => scrollTo("how")} className="nav-link" data-testid="nav-how">How It Works</button>
          <button onClick={() => scrollTo("impact")} className="nav-link" data-testid="nav-impact">Impact</button>
          <button onClick={() => scrollTo("contact")} className="nav-link" data-testid="nav-contact">Contact</button>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/track" className="btn-secondary" data-testid="nav-track-order">
            <PackageSearch size={18} /> Track Order
          </Link>
          <Link to="/order" className="btn-primary" data-testid="nav-order-now">
            <ShoppingBag size={18} /> Order Now
          </Link>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen((v) => !v)}
          data-testid="nav-mobile-toggle"
          aria-label="Toggle menu"
        >
          {open ? <X size={24} color="var(--glo-green)" /> : <Menu size={24} color="var(--glo-green)" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t" style={{ borderColor: "var(--glo-border)" }} data-testid="nav-mobile-menu">
          <div className="container-glo py-4 flex flex-col gap-4">
            <button onClick={() => scrollTo("mission")} className="text-left nav-link">Mission</button>
            <button onClick={() => scrollTo("how")} className="text-left nav-link">How It Works</button>
            <button onClick={() => scrollTo("impact")} className="text-left nav-link">Impact</button>
            <button onClick={() => scrollTo("contact")} className="text-left nav-link">Contact</button>
            <Link to="/track" onClick={() => setOpen(false)} className="btn-secondary justify-center">
              <PackageSearch size={18} /> Track Order
            </Link>
            <Link to="/order" onClick={() => setOpen(false)} className="btn-primary justify-center">
              <ShoppingBag size={18} /> Order Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
