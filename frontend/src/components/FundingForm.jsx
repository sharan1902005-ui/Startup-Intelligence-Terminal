import { Plus, Trash2 } from "lucide-react";
import { IconActivity } from "@tabler/icons-react";

const ROUND_TYPES = [
  "Seed",
  "Series A",
  "Series B",
  "Series C",
  "Series D",
  "Grant",
  "Angel",
  "Debt",
];

const SAMPLE_STARTUPS = {
  Airbnb: [
    { amount: 20000, days_since_last_round: 0, round_number: 1, round_type: 0 },
    { amount: 600000, days_since_last_round: 250, round_number: 2, round_type: 1 },
    { amount: 7200000, days_since_last_round: 310, round_number: 3, round_type: 2 },
    { amount: 112000000, days_since_last_round: 420, round_number: 4, round_type: 3 },
  ],
  Uber: [
    { amount: 200000, days_since_last_round: 0, round_number: 1, round_type: 0 },
    { amount: 1250000, days_since_last_round: 210, round_number: 2, round_type: 1 },
    { amount: 11000000, days_since_last_round: 260, round_number: 3, round_type: 2 },
    { amount: 37000000, days_since_last_round: 290, round_number: 4, round_type: 3 },
  ],
  Dropbox: [
    { amount: 15000, days_since_last_round: 0, round_number: 1, round_type: 0 },
    { amount: 1200000, days_since_last_round: 190, round_number: 2, round_type: 1 },
    { amount: 6000000, days_since_last_round: 300, round_number: 3, round_type: 2 },
  ],
  Stripe: [
    { amount: 120000, days_since_last_round: 0, round_number: 1, round_type: 0 },
    { amount: 2000000, days_since_last_round: 170, round_number: 2, round_type: 1 },
    { amount: 18000000, days_since_last_round: 260, round_number: 3, round_type: 2 },
    { amount: 80000000, days_since_last_round: 360, round_number: 4, round_type: 3 },
  ],
  Slack: [
    { amount: 1500000, days_since_last_round: 0, round_number: 1, round_type: 0 },
    { amount: 5000000, days_since_last_round: 240, round_number: 2, round_type: 1 },
    { amount: 42750000, days_since_last_round: 330, round_number: 3, round_type: 2 },
  ],
};

export { SAMPLE_STARTUPS };

export default function FundingForm({ rounds, setRounds, onPredict, loading, onLoadSample }) {
  const updateRound = (index, field, value) => {
    const nextRounds = rounds.map((round, currentIndex) => {
      if (currentIndex !== index) return round;
      return {
        ...round,
        [field]: field === "amount" ? value : Number(value),
      };
    });
    setRounds(nextRounds);
  };

  const addRound = () => {
    setRounds([
      ...rounds,
      {
        amount: "",
        round_number: rounds.length + 1,
        round_type: Math.min(rounds.length, 3),
        days_since_last_round: 180,
      },
    ]);
  };

  const removeRound = (index) => {
    const nextRounds = rounds
      .filter((_, currentIndex) => currentIndex !== index)
      .map((round, currentIndex) => ({ ...round, round_number: currentIndex + 1 }));
    setRounds(nextRounds);
  };

  const loadSample = (name) => {
    if (!name) return;
    if (onLoadSample) {
      onLoadSample(name);
      return;
    }
    setRounds(SAMPLE_STARTUPS[name].map((round) => ({ ...round })));
  };

  return (
    <section className="rounded-xl border-[0.5px] border-[#2c3447] bg-[#1d2436] p-5">
      <div className="flex flex-col gap-4 border-b-[0.5px] border-[#2c3447] pb-5">
        <div>
          <h2 className="text-xl font-semibold text-[#f1f3f8]">Funding History</h2>
          <p className="mt-1 text-sm text-[#8089a3]">Add each round in chronological order.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {["Uber", "Airbnb", "Stripe", "Dropbox"].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => loadSample(name)}
              className="rounded-lg border-[0.5px] border-[#2c3447] bg-[#141927] px-3 py-2 text-sm font-medium text-[#f1f3f8] transition hover:border-[#f0a448] hover:text-[#f0a448]"
            >
              {name}
            </button>
          ))}
          <select
            className="h-10 rounded-lg border-[0.5px] border-[#2c3447] bg-[#141927] px-3 text-sm text-[#f1f3f8] outline-none transition focus:border-[#f0a448]"
            defaultValue=""
            onChange={(event) => loadSample(event.target.value)}
          >
            <option value="" disabled>
              More samples
            </option>
            {Object.keys(SAMPLE_STARTUPS).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {rounds.map((round, index) => (
          <div key={index} className="grid gap-3 rounded-xl border-[0.5px] border-[#2c3447] bg-[#141927] p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <label className="text-sm text-[#8089a3]">
              Amount
              <input
                type="number"
                min="0"
                placeholder="500000"
                value={round.amount}
                onChange={(event) => updateRound(index, "amount", event.target.value)}
                className="font-mono-vitals mt-1 h-11 w-full rounded-lg border-[0.5px] border-[#2c3447] bg-[#141927] px-3 text-[#f1f3f8] outline-none transition focus:border-[#f0a448]"
              />
            </label>

            <label className="text-sm text-[#8089a3]">
              Days Since Last
              <input
                type="number"
                min="0"
                value={round.days_since_last_round}
                onChange={(event) => updateRound(index, "days_since_last_round", event.target.value)}
                className="font-mono-vitals mt-1 h-11 w-full rounded-lg border-[0.5px] border-[#2c3447] bg-[#141927] px-3 text-[#f1f3f8] outline-none transition focus:border-[#f0a448]"
              />
            </label>

            <label className="text-sm text-[#8089a3]">
              Round Type
              <select
                value={round.round_type}
                onChange={(event) => updateRound(index, "round_type", event.target.value)}
                className="mt-1 h-11 w-full rounded-lg border-[0.5px] border-[#2c3447] bg-[#141927] px-3 text-[#f1f3f8] outline-none transition focus:border-[#f0a448]"
              >
                {ROUND_TYPES.map((type, typeIndex) => (
                  <option key={type} value={typeIndex}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => removeRound(index)}
              className="mt-5 flex h-11 w-11 items-center justify-center rounded-lg border-[0.5px] border-[#2c3447] text-[#8089a3] transition hover:border-red-400 hover:text-red-300 sm:mt-auto"
              aria-label="Remove round"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={addRound}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border-[0.5px] border-[#2c3447] px-4 text-sm font-medium text-[#f1f3f8] transition hover:border-[#f0a448] hover:text-[#f0a448]"
        >
          <Plus className="h-4 w-4" />
          Add Round
        </button>

        <button
          type="button"
          onClick={onPredict}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#f0a448] px-5 text-sm font-semibold text-[#2e1c05] transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-[#2c3447] disabled:text-[#8089a3]"
        >
          <IconActivity className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Analyzing..." : "Read the vitals"}
        </button>
      </div>
    </section>
  );
}
