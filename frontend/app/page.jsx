"use client";
import { useRouter } from "next/navigation";
import { Nav, Footer, Ticker } from "../components/layout/HeaderFooter";
import { useAuth } from "../app/context/AuthContext";
import {
  HeroSection,
  StatsSection,
  MythBusterSection,
  HowItWorksSection,
  LeaderboardSection,
  ReplaySection,
  FinalCTA,
} from "../components/sections/CoreSections";
import {
  CompoundCalculator,
  DecisionSimulator,
} from "../components/features/InteractiveTools";

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Directs users based on their authentication status
  const handleStart = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/auth");
    }
  };

  const handleViewLeaderboard = () => {
    if (user) {
      router.push("/leaderboard");
    } else {
      router.push("/auth");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08090A",
        fontFamily:
          "'Inter Variable', 'Inter', -apple-system, system-ui, sans-serif",
        fontFeatureSettings: '"cv01", "ss03"',
        color: "#F7F8F8",
        overflowX: "hidden",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <Nav onStart={handleStart} />
        <Ticker />
        <HeroSection onStart={handleStart} />
        <StatsSection />
        <CompoundCalculator />
        <ReplaySection />
        <DecisionSimulator />
        <MythBusterSection />
        <HowItWorksSection />
        <LeaderboardSection onViewLeaderboard={handleViewLeaderboard} />
        <FinalCTA onStart={handleStart} />
        <Footer />
      </div>
    </div>
  );
}
