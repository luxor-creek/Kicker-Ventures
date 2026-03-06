import { motion } from "framer-motion";
import { Code2, TrendingUp, Settings } from "lucide-react";

const cards = [
  {
    icon: Code2,
    label: "Build",
    title: "The Developer",
    description:
      "We architect vertical AI applications designed for industrial-grade integration. From generative discovery in existing datasets to predictive revenue engines, we build the code that moves the needle.",
  },
  {
    icon: TrendingUp,
    label: "Invest",
    title: "The Venture Fund",
    description:
      "We are our own primary backers. By funding our own internal IP, we ensure total alignment of interests and the agility to move at the speed of the market without external bureaucracy.",
  },
  {
    icon: Settings,
    label: "Scale",
    title: "The Operator",
    description:
      "We don't hand off \"tools.\" We launch businesses. Kicker provides the executive leadership, GTM strategy, and operational rigor required to turn an application into a market leader.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const TriadSection = () => {
  return (
    <section id="triad" className="py-28 px-6 noise-bg">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">The Kicker Triad</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Most firms provide one. We provide the ecosystem.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-6"
        >
          {cards.map((card) => (
            <motion.div
              key={card.label}
              variants={item}
              className="glass-card rounded-xl p-8 hover:border-primary/20 transition-colors duration-300 group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <card.icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs tracking-[0.2em] uppercase text-primary font-semibold">
                {card.label}
              </span>
              <h3 className="text-xl font-bold mt-2 mb-4">{card.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {card.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TriadSection;
