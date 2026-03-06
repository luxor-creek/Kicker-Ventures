import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import viaxoLogo from "@/assets/viaxo-ai-logo.png";

const navLinks = [
  { label: "Contact", id: "contact" },
];


const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50" style={{ background: 'hsla(220, 30%, 2%, 0.8)', WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex-shrink-0">
          <img src={viaxoLogo} alt="Kicker Ventures" className="h-16 w-auto" />
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => navigate("/auth")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide"
          >
            Login
          </button>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-background/95 backdrop-blur-md border-b border-border/50 px-6 pb-4"
        >
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="block w-full text-left py-3 text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide border-b border-border/30"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => { setMobileOpen(false); navigate("/auth"); }}
            className="block w-full text-left py-3 text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide"
          >
            Login
          </button>
        </motion.div>
      )}
    </header>
  );
};

export default Header;
