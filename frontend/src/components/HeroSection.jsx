import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Brain, LineChart, Radar, Rocket, ShieldCheck, Sparkles, Target, TrendingUp } from "lucide-react";

const featureCards = [
  {
    icon: BarChart3,
    title: "Outcome Prediction",
    text: "Forecast whether the company is likely to continue growing, be acquired, or face shutdown risk.",
  },
  {
    icon: Target,
    title: "Confidence & Risk Analysis",
    text: "Understand prediction confidence, startup health score, and potential risk indicators.",
  },
  {
    icon: Brain,
    title: "AI Funding Intelligence",
    text: "Discover the key funding signals influencing the model's decision.",
  },
  {
    icon: Radar,
    title: "Historical Startup Matching",
    text: "Compare against similar historical companies using learned trajectory embeddings.",
  },
  {
    icon: LineChart,
    title: "Future Path Projection",
    text: "Visualize how the funding trajectory may evolve based on historical patterns.",
  },
];

export default function HeroSection({ survivalProbability = null, onLaunch, onDemo }) {
  const survival = Math.round(survivalProbability ?? 84);

  return (
    <header className="relative isolate overflow-hidden border-b-[0.5px] border-[#2c3447]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(128,137,163,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(128,137,163,0.08)_1px,transparent_1px)] bg-[size:42px_42px] opacity-50" />
      <motion.div
        aria-hidden="true"
        className="absolute -right-28 top-12 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.62, 0.35] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -left-20 bottom-10 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"
        animate={{ scale: [1.1, 0.95, 1.1], opacity: [0.28, 0.55, 0.28] }}
        transition={{ duration: 9, repeat: Infinity }}
      />
      <FloatingLines />

      <div className="relative mx-auto grid min-h-[760px] w-full max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="inline-flex items-center gap-2 rounded-full border-[0.5px] border-[#2c3447] bg-[#1d2436]/80 px-3 py-2 text-sm text-[#8089a3] backdrop-blur">
            <Sparkles className="h-4 w-4 text-[#f0a448]" />
            AI-Powered Startup Trajectory Intelligence
          </div>

          <h1 className="mt-7 max-w-4xl text-6xl font-semibold leading-[0.95] tracking-tight text-[#f1f3f8] sm:text-7xl lg:text-8xl">
            Will It Survive?
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#a8b0c7]">
            Analyze funding histories, identify growth signals, and predict whether a startup is likely heading toward continued growth, acquisition, or shutdown using machine learning and historical funding patterns.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onLaunch}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#f0a448] px-5 text-sm font-semibold text-[#2e1c05] transition hover:brightness-110"
            >
              Launch Analysis
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDemo}
              className="inline-flex h-12 items-center justify-center rounded-xl border-[0.5px] border-[#2c3447] bg-[#1d2436]/80 px-5 text-sm font-semibold text-[#f1f3f8] transition hover:border-[#f0a448] hover:text-[#f0a448]"
            >
              View Demo
            </button>
          </div>

          <section className="mt-12">
            <p className="text-sm uppercase tracking-[0.24em] text-[#8089a3]">What This Platform Does</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {featureCards.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.06 }}
                  className="rounded-xl border-[0.5px] border-[#2c3447] bg-[#1d2436]/70 p-4 backdrop-blur transition hover:border-[#f0a448]/60"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-[#f0a448]/10 p-2 text-[#f0a448]">
                      <feature.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#f1f3f8]">{feature.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[#8089a3]">{feature.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <p className="mt-8 text-sm text-[#8089a3]">
            Built for Founders, Analysts, Investors & Curious Builders
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8089a3]">
            Powered by sequence learning, funding trajectory analysis, startup embeddings, and machine learning models trained on historical startup funding events.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="relative">
          <IntelligenceCard survival={survival} />
        </motion.div>
      </div>

      <div className="relative border-t-[0.5px] border-[#2c3447] bg-[#141927]/60 px-5 py-4 text-center text-sm text-[#8089a3] backdrop-blur">
        Trusted by Data. Inspired by Venture Intelligence.
      </div>
    </header>
  );
}

function IntelligenceCard({ survival }) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="rounded-2xl border-[0.5px] border-[#2c3447] bg-[#1d2436]/90 p-6 shadow-2xl shadow-blue-950/40 backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#8089a3]">Growth Probability</p>
          <p className="font-mono-vitals mt-2 text-5xl font-semibold text-[#f1f3f8]">{survival}%</p>
        </div>
        <div className="rounded-xl border-[0.5px] border-[#2c3447] bg-[#141927] p-3 text-[#f0a448]">
          <ShieldCheck className="h-8 w-8" />
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-[#8089a3]">Startup Health Score</span>
          <span className="font-mono-vitals text-sm text-[#f0a448]">{survival}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#141927]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${survival}%` }}
            transition={{ duration: 1.1, delay: 0.3 }}
            className="h-full rounded-full bg-[#f0a448]"
          />
        </div>
      </div>

      <div className="mt-8 rounded-xl border-[0.5px] border-[#2c3447] bg-[#141927] p-4">
        <p className="text-sm font-semibold text-[#f1f3f8]">Signals</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Funding Velocity", "Funding Growth", "Strong Follow-on Rounds"].map((signal) => (
            <span key={signal} className="rounded-full border-[0.5px] border-[#f0a448]/35 bg-[#f0a448]/10 px-3 py-1 text-xs text-[#f0a448]">
              + {signal}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_auto] items-end gap-4">
        <div>
          <p className="text-sm text-[#8089a3]">Prediction</p>
          <p className="mt-1 text-3xl font-semibold text-[#f1f3f8]">Growing</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[#f0a448]/10 px-3 py-2 text-sm font-medium text-[#f0a448]">
          <TrendingUp className="h-4 w-4" />
          Signal rising
        </div>
      </div>
    </motion.div>
  );
}

function FloatingLines() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-40" aria-hidden="true">
      <motion.path
        d="M70 520 C 230 420, 310 570, 460 455 S 760 360, 900 440 S 1140 530, 1320 360"
        fill="none"
        stroke="#60a5fa"
        strokeWidth="1.5"
        strokeDasharray="8 10"
        animate={{ pathLength: [0.2, 1, 0.2], opacity: [0.15, 0.45, 0.15] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.path
        d="M120 220 C 320 290, 410 190, 560 250 S 840 360, 980 250 S 1190 180, 1360 270"
        fill="none"
        stroke="#a78bfa"
        strokeWidth="1.5"
        strokeDasharray="6 12"
        animate={{ pathLength: [1, 0.25, 1], opacity: [0.35, 0.12, 0.35] }}
        transition={{ duration: 12, repeat: Infinity }}
      />
    </svg>
  );
}
