import { useEffect, useState } from "react";
import { AuthModal } from "./AuthModal";
import { CTASection } from "./CTASection";
import { DashboardSection } from "./DashboardSection";
import { Footer } from "./Footer";
import { GlobalFlowLines } from "./GlobalFlowLines";
import { HeroSection } from "./HeroSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { ImportSection } from "./ImportSection";
import { Navbar } from "./Navbar";
import { ProblemSection } from "./ProblemSection";
import { SolutionSection } from "./SolutionSection";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import type { UserSession } from "../auth";

interface LandingPageProps {
  onAuthSuccess: (user: UserSession) => void;
  initialAuthMode?: "login" | "register" | null;
  onAuthRouteChange?: (mode: "login" | "register") => void;
  onAuthRequestClose?: () => void;
}

function LandingContent({
  onAuthSuccess,
  initialAuthMode = null,
  onAuthRouteChange,
  onAuthRequestClose,
}: LandingPageProps) {
  const { dark } = useTheme();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  useEffect(() => {
    if (!initialAuthMode) return;
    setAuthMode(initialAuthMode);
    setAuthOpen(true);
  }, [initialAuthMode]);

  const handleOpenAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
    onAuthRouteChange?.(mode);
  };

  const handleCloseAuth = () => {
    setAuthOpen(false);
    onAuthRequestClose?.();
  };

  return (
    <div
      className={`relative transition-colors duration-500 ${dark ? "bg-gray-950" : "bg-[#fafafe]"}`}
    >
      <GlobalFlowLines />
      <Navbar onOpenAuth={handleOpenAuth} />
      <AuthModal
        isOpen={authOpen}
        onClose={handleCloseAuth}
        initialMode={authMode}
        onSuccess={onAuthSuccess}
      />

      <div id="home" className="relative z-[6]">
        <HeroSection />
      </div>

      <HowItWorksSection />
      <ProblemSection />
      <SolutionSection />
      <DashboardSection />
      <ImportSection />

      <div className="relative z-[12]">
        <CTASection onOpenAuth={handleOpenAuth} />
        <Footer />
      </div>
    </div>
  );
}

export function LandingPage(props: LandingPageProps) {
  return (
    <ThemeProvider>
      <LandingContent {...props} />
    </ThemeProvider>
  );
}
