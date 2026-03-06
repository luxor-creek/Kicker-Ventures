import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt=""
          className="h-full w-full object-cover"
          aria-hidden="true"
        />
      </div>

      {/* Black overlay — 60% opacity */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content on top */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="text-sm tracking-[0.3em] uppercase text-white/60 mb-6 font-medium">
            AI Venture Studio
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-6 text-white">
            Architecting the{" "}
            <span className="text-gradient">Autonomous Enterprise.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed mb-4">
            We Build. We Capitalize. We Operate.
          </p>
          <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed mb-10">
            Kicker is a premier AI venture studio turning dormant data into
            breakthrough revenue, radical cost efficiency, and proprietary
            discovery. Backed by 25 years of technology leadership.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base font-semibold tracking-wide"
            onClick={() => document.getElementById("triad")?.scrollIntoView({ behavior: "smooth" })}
          >
            Explore the Model
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-base font-semibold tracking-wide"
            onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
          >
            Inquire
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
