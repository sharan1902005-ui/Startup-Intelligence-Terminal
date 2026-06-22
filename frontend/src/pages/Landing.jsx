import HeroSection from "../components/HeroSection";

export default function Landing({ onEnter, onDemo }) {
  return (
    <main className="min-h-screen bg-[#161b29] text-[#f1f3f8]">
      <HeroSection onLaunch={onEnter} onDemo={onDemo} />
    </main>
  );
}
