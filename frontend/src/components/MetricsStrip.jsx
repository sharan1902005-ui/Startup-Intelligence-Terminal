import { motion } from "framer-motion";
import { CalendarClock, CircleDollarSign, Gauge, Layers } from "lucide-react";

export default function MetricsStrip({ metrics }) {
  const cards = [
    { label: "Total Funding Raised", value: metrics.totalFundingLabel, icon: CircleDollarSign },
    { label: "Number of Funding Rounds", value: `${metrics.roundCount} Rounds`, icon: Layers },
    { label: "Average Round Gap", value: metrics.avgGapLabel, icon: CalendarClock },
    { label: "Funding Velocity", value: `${metrics.velocity} Velocity`, icon: Gauge },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="rounded-xl border-[0.5px] border-[#2c3447] bg-[#1d2436] p-4"
        >
          <div className="flex items-center gap-2 text-[#8089a3]">
            <card.icon className="h-4 w-4 text-[#f0a448]" />
            <span className="text-xs">{card.label}</span>
          </div>
          <p className="font-mono-vitals mt-3 text-xl font-semibold text-[#f1f3f8]">{card.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
