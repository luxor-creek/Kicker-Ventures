import { motion } from "framer-motion";
import { Zap, Cpu, Search } from "lucide-react";

const outcomes = [
  {
    icon: Zap,
    title: "Revenue Acceleration",
    description:
      "Identifying untapped market signals to drive top-line growth.",
  },
  {
    icon: Cpu,
    title: "Structural Efficiency",
    description:
      "Implementing autonomous workflows that reduce OpEx by orders of magnitude.",
  },
  {
    icon: Search,
    title: "Data Breakthroughs",
    description:
      "Using frontier models to find \"the needle\" in your historical data silos, turning cost centers into IP.",
  },
];

const ROISection = () => {
  return (
    <section className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Intelligence with an ROI.
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            AI is only as valuable as the problems it solves. We focus on three core outcomes.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {outcomes.map((o, i) => (
            <motion.div
              key={o.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <o.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-3">{o.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {o.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ROISection;
