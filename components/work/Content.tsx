import Link from "next/link";

const Content = () => {
  return (
    <div className="max-w-2xl flex flex-col gap-3 dark:text-gray-400">
      <p>
        I&apos;ve been developing&nbsp;
        <Link href="/skills" className="text-secondary">
          <span>skills</span>
        </Link>
        &nbsp;and working on&nbsp;
        <Link href="/skills" className="text-secondary">
          <span>projects</span>
        </Link>
        &nbsp;for past 5+ years and have an industry level experience as a full
        stack developer.
      </p>

      <p>
        I&apos;m looking up for work opportunities as a FullStack web developer.
      </p>
    </div>
  );
};

export default Content;
