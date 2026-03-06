import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import TriadSection from "@/components/TriadSection";
import ROISection from "@/components/ROISection";
import PedigreeSection from "@/components/PedigreeSection";
import StandardSection from "@/components/StandardSection";
import FooterContact from "@/components/FooterContact";

const Index = () => {
  return (
    <main className="dark min-h-screen bg-background text-foreground overflow-x-hidden">
      <Header />
      <HeroSection />
      <TriadSection />
      <ROISection />
      <PedigreeSection />
      <StandardSection />
      <FooterContact />
    </main>
  );
};

export default Index;
