import { motion } from "framer-motion";
import viaxoCrest from "@/assets/viaxo-crest.png";

const PedigreeSection = () => {
  return (
    <section className="py-28 px-6 noise-bg">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left — Statement */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
              25 Years of{" "}
              <span className="text-gradient">Pattern Recognition.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              The founders of Kicker bring a quarter-century of experience in
              software architecture, enterprise scaling, and digital media.
              We understand that while the technology changes, the fundamentals
              of a successful business—security, scalability, and
              profitability—are non-negotiable.
            </p>

            {/* Quote */}
            <div className="border-l-2 border-primary pl-6">
              <p className="text-lg md:text-xl italic text-foreground/90 leading-relaxed">
                "In a sea of AI noise, Kicker is the signal. It brings the
                maturity of seasoned technologists to the most disruptive
                frontier in history."
              </p>
              <p className="mt-3 text-sm font-semibold text-foreground/80 text-right">— Nathan Denny</p>
              <p className="text-sm text-muted-foreground text-right">Investor, early at Slack</p>
            </div>
          </motion.div>

          {/* Right — Abstract visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <div className="relative w-full max-w-md aspect-square">
              {/* Concentric rings */}
              <div className="absolute inset-0 rounded-full border border-primary/10 animate-pulse" />
              <div className="absolute inset-8 rounded-full border border-primary/15" />
              <div className="absolute inset-16 rounded-full border border-primary/20" />
              <div className="absolute inset-24 rounded-full border border-primary/30 flex items-center justify-center">
                <img src={viaxoCrest} alt="Kicker" className="w-24 h-24 object-contain" />
              </div>
              {/* Glow */}
              <div className="absolute inset-0 rounded-full bg-primary/5 blur-[60px]" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PedigreeSection;
