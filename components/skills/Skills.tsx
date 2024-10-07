import { Skill } from "@/props";

const Skills = () => {
  return (
    <section className="flex flex-col items-center justify-center mt-20 max-w-3xl xl:max-w-6xl">
      <h2 className="text-2xl font-bold text-secondary mb-3 text-left w-full">
        Technologies
      </h2>

      {/* mapping the technologies */}

      <div className="flex flex-wrap justify-center gap-10">
      <Skill
          domain="Languages"
          logo={[
            "/logos/csvg.svg",
            "/logos/cpp.svg",
            "/logos/python.svg",
            "/logos/java.svg",
            "/logos/js.svg"
          ]}
          tech={["c", "c++", "python","Java","Javascript"]}
        />
        <Skill
          domain="Frontend Dev"
          logo={[
            "/logos/nextjs.svg",
            "/logos/reactjs.svg",
            "/logos/ts.svg",
            "/logos/redux.svg",
            "/logos/html.svg",
            "/logos/css.svg",
          ]}
          tech={[
            "Next.js",
            "React",
            "TypeScript",
            "JavaScript",
            "Redux",
            "HTML",
            "CSS",
          ]}
        />

        <Skill
          domain="Backend Dev"
          logo={[
            "/logos/node.svg",
            "/logos/flask.svg",
            "logos/django.svg"
          ]}
          tech={[
            "Node.js",
            "Flask",
            "Django",
          ]}
        />

        <Skill
          domain="Database"
          logo={[
            "/logos/mongodb.svg",
            "/logos/mysql.svg",
          ]}
          tech={["MongoDB", "Mysql"]}
        />

        <Skill
          domain="Mobile Dev"
          logo={["/logos/react-native.svg", "/logos/expo.svg"]}
          tech={["React Native", "Expo"]}
        />

        <Skill
          domain="Tools"
          logo={[
            "/logos/windows.svg",
            "/logos/Ubuntu.svg",
            "/logos/kubernets.svg",
            "/logos/docker.svg",
            "/logos/digitalocean.svg",
            "/logos/git.svg",
            "/logos/github.svg",
            "/logos/vscode.svg",
            "/logos/aws.svg",
            "/logos/firebase.svg",
            "/logos/postman.svg",
          ]}
          tech={[
            "windows",
            "Ubuntu",
            "Kubernets",
            "Docker",
            "Digital ocean",
            "Git",
            "Github",
            "VS Code",
            "AWS",
            "Firebase",
            "Postman",
          ]}
        />
      </div>
    </section>
  );
};

export default Skills;
