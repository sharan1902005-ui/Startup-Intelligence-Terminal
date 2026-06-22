import { useState } from "react";
import { ChevronDown, Cpu } from "lucide-react";
import DashboardCard from "./DashboardCard";

export default function ModelSignals({ positiveSignals, riskSignals }) {
  const [open, setOpen] = useState(false);

  return (
    <DashboardCard className="p-5" delay={0.16}>
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 text-left">
        <span className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-[#f0a448]" />
          <span className="text-lg font-semibold text-[#f1f3f8]">How The Model Thinks</span>
        </span>
        <ChevronDown className={`h-5 w-5 text-[#8089a3] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <SignalGroup title="Positive Signals" items={positiveSignals} tone="positive" />
          <SignalGroup title="Risk Signals" items={riskSignals} tone="risk" />
        </div>
      ) : null}
    </DashboardCard>
  );
}

function SignalGroup({ title, items, tone }) {
  const color = tone === "positive" ? "text-[#f0a448] border-[#f0a448]/35 bg-[#f0a448]/10" : "text-red-300 border-red-400/30 bg-red-500/10";
  const prefix = tone === "positive" ? "+" : "-";

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#f1f3f8]">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className={`rounded-full border-[0.5px] px-3 py-1 text-xs ${color}`}>
            {prefix} {item}
          </span>
        ))}
      </div>
    </div>
  );
}
