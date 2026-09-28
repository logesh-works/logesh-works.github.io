import ExperienceRoot from "@/components/experience/ExperienceRoot";
import Contact from "@/components/story/chapters/Contact";
import Experience from "@/components/story/chapters/Experience";
import Identity from "@/components/story/chapters/Identity";
import OpenSource from "@/components/story/chapters/OpenSource";
import Opening from "@/components/story/chapters/Opening";
import Research from "@/components/story/chapters/Research";
import Systems from "@/components/story/chapters/Systems";

export default function Home() {
  return (
    <>
      <ExperienceRoot />
      <main className="story">
        <Opening />
        <Identity />
        <Systems />
        <Experience />
        <OpenSource />
        <Research />
        <Contact />
      </main>
    </>
  );
}
