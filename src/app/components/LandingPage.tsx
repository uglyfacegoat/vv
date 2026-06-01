import { useEffect, useState } from "react";
import { AuthModal } from "./AuthModal";
import { CTASection } from "./CTASection";
import { DashboardSection } from "./DashboardSection";
import { GlobalFlowLines } from "./GlobalFlowLines";
import { HeroIntroSection } from "./HeroIntroSection";
import { HeroSection } from "./HeroSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { ImportSection } from "./ImportSection";
import { Navbar } from "./Navbar";
import { ProblemSection } from "./ProblemSection";
import { SolutionSection } from "./SolutionSection";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import { LandingI18nContext, landingCopy, type LandingLanguage } from "./landingI18n";
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
  const [language, setLanguageState] = useState<LandingLanguage>(() => {
    const saved = localStorage.getItem("budgetiq.landing.language");
    return saved === "en" || saved === "zh" || saved === "es" || saved === "ru" ? saved : "ru";
  });

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

  const setLanguage = (nextLanguage: LandingLanguage) => {
    setLanguageState(nextLanguage);
    localStorage.setItem("budgetiq.landing.language", nextLanguage);
  };

  return (
    <LandingI18nContext.Provider value={{ language, setLanguage, copy: landingCopy[language] }}>
      <div
        className={`relative transition-colors duration-500 ${dark ? "bg-gray-950" : "bg-[#fafafe]"}`}
        lang={language === "zh" ? "zh-CN" : language}
    >
      <GlobalFlowLines />
      <Navbar onOpenAuth={handleOpenAuth} />
      <AuthModal
        isOpen={authOpen}
        onClose={handleCloseAuth}
        initialMode={authMode}
        onSuccess={onAuthSuccess}
      />

      <div className="relative z-[6]">
        <HeroIntroSection onOpenAuth={handleOpenAuth} />
      </div>

      <div id="main-hero" className="relative z-[6]">
        <HeroSection />
      </div>

      <HowItWorksSection />
      <ProblemSection />
      <SolutionSection />
      <DashboardSection />
      <ImportSection />

      <div className="relative z-[12]">
        <CTASection onOpenAuth={handleOpenAuth} />
      </div>
      </div>
    </LandingI18nContext.Provider>
  );
}

export function LandingPage(props: LandingPageProps) {
  return (
    <ThemeProvider>
      <LandingContent {...props} />
    </ThemeProvider>
  );
}
