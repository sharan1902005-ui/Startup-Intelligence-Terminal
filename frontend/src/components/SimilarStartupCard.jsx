const descriptions = {
  LearnBoost: "Education SaaS with staged venture traction.",
  "Extend Labs": "Product-led platform with comparable early funding cadence.",
  RealMassive: "Marketplace startup with similar follow-on timing.",
  "Patron Technology": "Event technology company with steady capital signals.",
  SmartCrowdz: "Operations platform with adjacent growth trajectory.",
  Dropbox: "File collaboration platform with fast early funding acceleration.",
  Slack: "B2B workflow company with strong follow-on round cadence.",
  Canva: "Design platform with durable capital efficiency signals.",
};

const logoDomains = {
  Dropbox: "dropbox.com",
  Slack: "slack.com",
  Canva: "canva.com",
  LearnBoost: "learnboost.com",
  "Patron Technology": "patrontechnology.com",
};

export default function SimilarStartupCard({ startup }) {
  const domain = logoDomains[startup.name];
  const initials = startup.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-xl border-[0.5px] border-[#2c3447] bg-[#141927] p-4 transition hover:border-[#f0a448]/60 hover:bg-[#1d2436]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border-[0.5px] border-[#2c3447] bg-[#1d2436] text-[#f0a448]">
            <span className="font-mono-vitals text-xs font-semibold">{initials}</span>
            {domain ? (
              <img
                src={`https://logo.clearbit.com/${domain}`}
                alt={`${startup.name} logo`}
                className="absolute inset-0 h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : null}
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#f1f3f8]">{startup.name}</h3>
            <p className="mt-1 text-xs leading-5 text-[#8089a3]">
              {startup.description || descriptions[startup.name] || "Historical company with a comparable funding trajectory."}
            </p>
          </div>
        </div>
        <p className="font-mono-vitals text-sm font-semibold text-[#f0a448]">{startup.similarity}%</p>
      </div>
    </div>
  );
}
