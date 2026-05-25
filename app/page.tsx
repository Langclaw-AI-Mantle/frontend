import Capabilities from "@/components/Capabilities";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { HomeDataSources } from "@/components/HomeDataSources";
import HomeDemoLaunchpad from "@/components/HomeDemoLaunchpad";
import { SquigglyHome } from "@/components/SquigglyHome";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_30%),linear-gradient(180deg,var(--background),var(--muted)_52%,var(--background))]">
      <Header />
      <Hero />
      <HomeDemoLaunchpad />
      <HomeDataSources />
      <SquigglyHome />
      <Capabilities />
    </main>
  );
}
