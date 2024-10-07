import Link from "next/link";
import Image from "next/image";

// icons
import { HiOutlineBriefcase } from "react-icons/hi";
import { BsFillFileEarmarkCodeFill } from "react-icons/bs";
import "./aboutimage.css"
// props
import { AboutCard } from "@/props";

// components
import { Education } from "@/components/about";

// shadcn
import { Button } from "@/components/ui/button";

import { getBase64 } from "@plaiceholder/base64";
import fs from "fs";
import path from "path";

const About = async () => {
  // get path to current directory
  const __dirname = path.resolve();

  // read image file
  const image = fs.readFileSync(
    path.join(__dirname, "/public/images/me-sidelook.jpeg")
  );

  const base64String = await getBase64(image);

  return (
    <div className="flex flex-col items-center py-14 gap-10 px-10 pb-24">
      <h1 className="text-4xl font-bold">About Me</h1>

      <section className="flex flex-col gap-7 items-center md:flex-row lg:gap-16">
        <Image
          src="/images/me-sidelook.jpeg"
          alt="Rachit Bharadwaj"
          width={1000}
          height={1000}
          className="h-52 w-fit rounded-xl lg:h-64 xl:h-80 roundimg"
          placeholder="blur"
          blurDataURL={base64String}
        />

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-5">
            <AboutCard
              link="/work"
              Icon={HiOutlineBriefcase}
              title="Experience"
              duration="5 years+"
            />

            <AboutCard
              link="/projects"
              Icon={BsFillFileEarmarkCodeFill}
              title="Projects"
              duration="32+"
            />
          </div>

          <p className="max-w-xl text-gray-400">
          With a passion for coding ignited at the tender age of 12, I have embarked on an exciting journey as a full stack developer, DevOps practitioner, and creator of AI-powered Telegram bots. Fueled by an insatiable curiosity, I delve into the realm of ethical hacking, tirelessly uncovering vulnerabilities to fortify digital landscapes. Guided by the ethos of collaboration and knowledge sharing, I am an avid advocate of open-source development, contributing to the collective progress of the coding community. Join me on this remarkable expedition through the frontiers of technology, where innovation knows no bounds.
          </p>
        </div>
      </section>

      {/* ................... education section ............ */}
      <Education />

      <div className="flex gap-5 lg:mt-10">
        <Button variant="outline" size="lg">
          <Link href="/skills" className="md:text-lg">
            Skills
          </Link>
        </Button>

        <Button variant="secondary" size="lg">
          <Link href="/contact" className="md:text-lg">
            Contact me
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default About;

export const generateMetadata = () => {
  return {
    title: "About | Logesh",
  };
};