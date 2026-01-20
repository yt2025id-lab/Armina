"use client";

import { useState } from "react";
import Image from "next/image";

interface OnboardingSlidesProps {
  onComplete: () => void;
}

const slides = [
  {
    id: 1,
    title: "ARMINA",
    subtitle: "Welcome to",
    description:
      "The first on-chain rotating savings platform (arisan) for the Indonesian community. Transparent, secure, and auto-generating yield.",
    gradient: "from-[#1e2a4a] via-[#2a3a5c] to-[#1e2a4a]",
  },
  {
    id: 2,
    title: "How It Works",
    subtitle: "Arisan Mini App",
    steps: [
      { num: "01", text: "Choose a pool that fits your budget" },
      { num: "02", text: "Deposit collateral + first contribution" },
      { num: "03", text: "Pay contribution before day 10" },
      { num: "04", text: "Day 20: Winner drawing" },
      { num: "05", text: "Winner receives pot + yield monthly" },
      { num: "06", text: "Pool ends, collateral + yield returned" },
    ],
    gradient: "from-[#2a3a5c] via-[#1e2a4a] to-[#2a3a5c]",
  },
  {
    id: 3,
    title: "Collateral",
    subtitle: "1000%",
    description: "Maximum protection for all participants",
    details: [
      { icon: "◈", label: "Collateral", value: "1000% (10x total pot)" },
      { icon: "◈", label: "If default", value: "Auto cover payment" },
      { icon: "◈", label: "Pool ends", value: "100% back + yield" },
      { icon: "◈", label: "High security", value: "Fully protected" },
    ],
    gradient: "from-[#1e2a4a] via-[#3a4a6c] to-[#1e2a4a]",
  },
  {
    id: 4,
    title: "Double",
    subtitle: "Yield",
    description: "AI Optimizer automatically selects the highest APY lending protocol",
    yields: [
      {
        type: "Collateral Yield",
        desc: "Your collateral generates yield while pool is active, automatically deployed to highest APY protocol",
        color: "text-emerald-400"
      },
      {
        type: "Pot Yield",
        desc: "Collected contributions earn yield during collection period",
        color: "text-cyan-400"
      },
    ],
    protocols: ["Moonwell", "Aave", "Compound", "Morpho", "Fluid", "Euler", "Spark", "Venus", "Benqi", "Radiant"],
    gradient: "from-[#2a3a5c] via-[#1e2a4a] to-[#3a4a6c]",
  },
  {
    id: 5,
    title: "Reputation",
    subtitle: "System",
    description: "Build your reputation score to climb the leaderboard",
    scores: [
      { action: "On-time payment", points: "+10", positive: true },
      { action: "Complete pool", points: "+50", positive: true },
      { action: "Late payment", points: "-20", positive: false },
      { action: "Default", points: "-100", positive: false },
    ],
    levels: [
      { name: "Bronze", discount: "0%", color: "bg-amber-500/20 text-amber-300" },
      { name: "Silver", discount: "10%", color: "bg-slate-300/20 text-slate-200" },
      { name: "Gold", discount: "20%", color: "bg-yellow-500/20 text-yellow-300" },
      { name: "Diamond", discount: "25%", color: "bg-cyan-400/20 text-cyan-300" },
    ],
    gradient: "from-[#1e2a4a] via-[#2a3a5c] to-[#1e2a4a]",
  },
  {
    id: 6,
    title: "Ready to",
    subtitle: "Start?",
    description: "Mint your free Reputation NFT to begin. This NFT is Soulbound and non-transferable.",
    cta: true,
    gradient: "from-[#3a4a6c] via-[#1e2a4a] to-[#2a3a5c]",
  },
];

export function OnboardingSlides({ onComplete }: OnboardingSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNext = () => {
    if (isAnimating) return;
    if (currentSlide < slides.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide + 1);
        setIsAnimating(false);
      }, 150);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (isAnimating) return;
    if (currentSlide > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem("armina_onboarding_complete", "true");
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const slide = slides[currentSlide];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-center">
      {/* Animated gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-all duration-500`}
      />

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg flex flex-col relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "w-8 bg-white"
                    : index < currentSlide
                    ? "w-4 bg-white/50"
                    : "w-4 bg-white/20"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-white/40 hover:text-white/70 text-sm font-medium transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Content */}
        <div
          className={`flex-1 px-6 pb-6 flex flex-col transition-all duration-300 ${
            isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          }`}
        >
          {/* Logo on first slide */}
          {currentSlide === 0 && (
            <div className="flex justify-center mb-8">
              <div className="w-28 h-28 relative">
                <div className="absolute inset-0 bg-white/10 rounded-3xl blur-xl" />
                <Image
                  src="/logo.png"
                  alt="Armina Logo"
                  fill
                  className="object-contain relative z-10"
                  priority
                />
              </div>
            </div>
          )}

          {/* Title */}
          <div className="text-center mb-6">
            <p className="text-white/50 text-sm font-medium tracking-widest uppercase mb-2">
              {slide.subtitle}
            </p>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              {slide.title}
            </h1>
          </div>

          {/* Description */}
          {slide.description && (
            <div className="text-center mb-8 max-w-xs mx-auto">
              <p className="text-white/70 text-sm leading-relaxed">
                {slide.description}
              </p>
            </div>
          )}

          {/* Steps (Slide 2) */}
          {slide.steps && (
            <div className="space-y-2.5 flex-1">
              {slide.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-white/[0.08] backdrop-blur-sm rounded-2xl border border-white/10"
                >
                  <span className="text-white/30 text-xs font-mono w-6">
                    {step.num}
                  </span>
                  <p className="text-white/90 text-sm font-medium">{step.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Details (Slide 3 - Collateral) */}
          {slide.details && (
            <div className="space-y-3 flex-1">
              {slide.details.map((detail, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white/[0.08] backdrop-blur-sm rounded-2xl border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white/30">{detail.icon}</span>
                    <span className="text-white/70 text-sm">{detail.label}</span>
                  </div>
                  <span className="text-white font-medium text-sm">
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Yields (Slide 4 - AI Optimizer) */}
          {slide.yields && (
            <div className="flex-1 space-y-4">
              {slide.yields.map((y, index) => (
                <div
                  key={index}
                  className="p-5 bg-white/[0.08] backdrop-blur-sm rounded-2xl border border-white/10"
                >
                  <p className={`${y.color} font-semibold text-lg mb-1`}>{y.type}</p>
                  <p className="text-white/60 text-sm">{y.desc}</p>
                </div>
              ))}
              {slide.protocols && (
                <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                  {slide.protocols.map((p, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-white/[0.06] rounded-full text-white/40 text-xs"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Scores & Levels (Slide 5 - Reputation) */}
          {slide.scores && (
            <div className="flex-1 space-y-4">
              <div className="p-4 bg-white/[0.08] backdrop-blur-sm rounded-2xl border border-white/10">
                <p className="text-white/40 text-xs font-medium mb-3 uppercase tracking-wider">
                  Points
                </p>
                <div className="space-y-2">
                  {slide.scores.map((score, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">{score.action}</span>
                      <span
                        className={`font-semibold text-sm ${
                          score.positive ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {score.points}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {slide.levels && (
                <div className="grid grid-cols-4 gap-2">
                  {slide.levels.map((level, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-xl text-center ${level.color}`}
                    >
                      <p className="font-semibold text-xs mb-0.5">{level.name}</p>
                      <p className="text-[10px] opacity-70">-{level.discount}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CTA (Slide 6) - Bilingual */}
          {slide.cta && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 rounded-full blur-2xl scale-150" />
                <div className="w-32 h-32 bg-white/[0.08] backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 relative">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">NFT</p>
                    <p className="text-white/40 text-xs">Soulbound</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation - Bilingual */}
        <div className="px-6 pb-8 space-y-4">
          <div className="flex gap-3">
            {currentSlide > 0 && (
              <button
                onClick={handlePrev}
                className="flex-1 py-3.5 px-4 bg-white/[0.08] backdrop-blur-sm text-white rounded-2xl font-medium hover:bg-white/[0.12] transition-all border border-white/10"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 py-3.5 px-4 bg-white text-[#1e2a4a] rounded-2xl font-semibold hover:bg-white/90 transition-all shadow-lg shadow-white/10"
            >
              {currentSlide === slides.length - 1 ? "Start Now" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
