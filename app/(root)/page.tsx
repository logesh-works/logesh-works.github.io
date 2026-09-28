import ExperienceRoot from "@/components/experience/ExperienceRoot";
import Blocks from "@/components/home/Blocks";
import HomeFooter from "@/components/home/HomeFooter";
import Intro from "@/components/home/Intro";
import ScrollTrack from "@/components/home/ScrollTrack";
import { ProfilePanel, TimelinePanel } from "@/components/hud/Panels";
import Toolbar from "@/components/hud/Toolbar";
import Tutorials from "@/components/hud/Tutorials";

/**
 * One stage, one character, and a camera the scroll moves around him. Copy sits in
 * fixed blocks that swap per stop; the footer rises out of the scene at the end.
 */
export default function Home() {
  return (
    <>
      <ExperienceRoot />
      <main className="relative">
        <Intro />
        <ScrollTrack />
        <Blocks />
        <HomeFooter />
      </main>
      <Toolbar />
      <Tutorials />
      <TimelinePanel />
      <ProfilePanel />
    </>
  );
}
