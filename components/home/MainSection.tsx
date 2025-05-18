import Image from "next/image";
import Link from "next/link";

// shadcn
import { Button } from "../ui/button";

const MainSection = () => {
  return (
    <section className="flex flex-col justify-center items-center py-20 gap-10">
      <div className="flex flex-col gap-3">
        <p>Hello, I&apos;m</p>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold">
          Logesh Kumar
        </h1>

        <p>Fullstack Engineer | And More...</p>
      </div>

      <div className="social-links flex flex-row gap-8">
        <a href="https://github.com/logesh-works" className="twitter"><i className="bi bi-github"></i></a>
        <a href="https://twitter.com/zxlogi" className="twitter"><i className="bi bi-twitter"></i></a>
        <a href="https://telegram.me/zxlogi" className="facebook"><i className="bi bi-telegram"></i></a>
        <a href="https://instagram.com/zxlogi/" className="instagram"><i className="bi bi-instagram"></i></a>
        <a href="https://www.linkedin.com/in/cl-me-logesh007/" className="linkedin"><i className="bi bi-linkedin"></i></a>
        
      </div>

      <div className="flex gap-5 lg:mt-10">
        <Link href="/resume.pdf">
          <Button variant="outline" size="lg">
            <p className="md:text-lg">Resume</p>
          </Button>
        </Link>

        <Link href="/about">
          <Button variant="outline" size="lg">
            <p className="md:text-lg">About me </p>
          </Button>
        </Link>
      </div>
      <div className="flex lg:mt-2">
        <Link href="/blog">
          <Button variant="secondary" size="lg">
            <p className="md:text-lg">My Blog</p>
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default MainSection;
