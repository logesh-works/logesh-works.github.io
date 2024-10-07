import { Project } from "@/props";

const Projects = () => {
  return (
    <div className="flex flex-wrap gap-10 justify-center">
      <Project
        title="GenEHR"
        description="Create a system that listens to conversations between doctors and patients, turns the 
spoken words into text, and organizes them into a clear, structured medical report"
        preview="/images/projects/genehr.jpg"
        githubLink="#"
        liveLink="#"
        techLogo={[
          "/logos/python.svg",
          "/logos/django.svg",
          "/logos/mysql.svg",
          "/logos/reactjs.svg",
        ]}
        techStack={["Next JS", "Node JS", "Tailwind CSS"]}
      />

      <Project
        title="Lofi AI"
        description="Lofi AI is a feature-rich web application designed for seamless real-time communication. Built with modern technologies like ReactJS, This offers a smooth and responsive UI for users to connect and chat."
        preview="/images/projects/lofiai.png"
        githubLink="https://github.com/logesh-works/Gemini-ai"
        liveLink="https://lofiai.netlify.app/"
        techLogo={[
          "/logos/reactjs.svg",
          "/logos/node.svg",
          "/logos/mongodb.svg",
        ]}
        techStack={[
          "React JS",
          "Node JS",
          "Express JS",
          "MongoDB",
          "Socket.IO",
          "Tailwind CSS",
        ]}
      />

      <Project
        title="institution Management App"
        description="I developed a comprehensive app for managing finance, student attendance, staff, and institution operations. The app simplifies tasks such as tracking student attendance, monitoring staff performance, and handling financial records. It also supports student management."
        preview="/images/projects/rev.png"
        githubLink="https://github.com/logesh-works/Revenue_app"
        liveLink="https://csceducation.net"
        techLogo={[
          "/logos/python.svg",
          "/logos/django.svg",
          "/logos/mysql.svg",
          "/logos/tailwind.svg",
        ]}
        techStack={["Next JS", "Node JS", "Tailwind CSS"]}
      />

      <Project
        title="Astronomy Picture of the Day"
        description="This Project presents Astronomy Picture of the Day By NASA using API."
        preview="/images/projects/nasa.png"
        githubLink="https://github.com/logesh-works/NASA-APOD"
        liveLink="https://apodofnasa.netlify.app/"
        techLogo={[
          "/logos/nextjs.svg",
          "/logos/reactjs.svg",
          "/logos/node.svg",
          "/logos/tailwind.svg",
        ]}
        techStack={["Next JS", "Node JS", "Tailwind CSS"]}
      />

      <Project
        title="EasyMail"
        description="Disposable email - is a free email service that allows to receive email at a temporary address that self-destructed after a certain time elapses."
        preview="/images/projects/mail.png"
        githubLink="https://github.com/logesh-works/disposable-email"
        liveLink="https://easymail.netlify.app/"
        techLogo={[
          "/logos/node.svg",
          "/logos/reactjs.svg",
          "/logos/html.svg",
          "/logos/js.svg",
          "/logos/tailwind.svg",
        ]}
        techStack={["Node JS", "Express JS", "HTML", "JS", "Tailwind CSS"]}
      />
    </div>
  );
};

export default Projects;
