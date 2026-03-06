import { motion } from "framer-motion";
import { ShieldCheck, Eye, Brain } from "lucide-react";

const standards = [
  {
    icon: ShieldCheck,
    title: "Zero-Training Mandate",
    description:
      "Your data is an appreciating asset. We never use client datasets to train external or public models. Every insight generated remains within your siloed ecosystem.",
  },
  {
    icon: Eye,
    title: "Total Sovereignty",
    description:
      'We build "Glass Box" systems. You maintain full visibility into how your AI operates, ensuring that every breakthrough is auditable, explainable, and under your direct control.',
  },
  {
    icon: Brain,
    title: "Augmented Authority",
    description:
      "Our applications are designed to enhance human decision-making, not automate it away. We provide the intelligence; you provide the command.",
  },
];

const StandardSection = () => {
  return (
    <section className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">The Kicker Ventures Standard</h2>
          <p className="text-primary font-semibold tracking-wide text-sm uppercase mb-3">
            Architectural Integrity & Data Sovereignty
          </p>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            At Kicker Ventures, we believe that the most powerful AI is the one you own completely.
          </p>
        </motion.div>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {standards.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card rounded-xl p-8"
            >
              <s.icon className="w-8 h-8 text-primary mb-5" />
              <h3 className="text-lg font-bold mb-3">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {s.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StandardSection;
