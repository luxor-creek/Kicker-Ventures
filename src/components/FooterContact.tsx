import { useEffect } from "react";
import { motion } from "framer-motion";
import viaxoLogo from "@/assets/viaxo-ai-logo.png";

const FooterContact = () => {
  useEffect(() => {
    const d = document;
    const w = "https://tally.so/widgets/embed.js";
    const v = () => {
      if (typeof (window as any).Tally !== "undefined") {
        (window as any).Tally.loadEmbeds();
      } else {
        d.querySelectorAll("iframe[data-tally-src]:not([src])").forEach((e: any) => {
          e.src = e.dataset.tallySrc;
        });
      }
    };
    if (typeof (window as any).Tally !== "undefined") {
      v();
    } else if (!d.querySelector(`script[src="${w}"]`)) {
      const s = d.createElement("script");
      s.src = w;
      s.onload = v;
      s.onerror = v;
      d.body.appendChild(s);
    }
  }, []);

  return (
    <footer id="contact" className="py-28 px-6 noise-bg border-t border-border">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Stealth in Motion.</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We are currently developing a selective portfolio of AI-first ventures.
            Whether you are a strategic partner, a prospective talent, or looking for
            an acquisition opportunity, let's start a conversation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Tally Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <iframe
              data-tally-src="https://tally.so/embed/VL5D5y?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
              loading="lazy"
              width="100%"
              height="300"
              frameBorder={0}
              title="Contact Form"
              className="w-full"
            />
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center md:items-end justify-center gap-8"
          >
            <img src={viaxoLogo} alt="Kicker" className="w-48 opacity-80" />
          </motion.div>
        </div>

        <div className="mt-20 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground text-sm">
            Kicker Inc. © 2026 | Built for the Next Era of Industry.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterContact;
