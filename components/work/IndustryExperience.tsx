import { Experience } from "@/props";

const IndustryExperience = () => {
  return (
    <section className="flex flex-col items-center justify-center mt-20">
      <h2 className="text-2xl font-bold text-secondary mb-3 text-left w-full">
        Experience
      </h2>

      <div className="flex flex-wrap gap-10">
        <Experience
          company="FreeLancer"
          position="Full-Stack Web Developer"
          startDate="2020"
          endDate="present"
          description="I've always been enjoying to experiment new technologies, working with people coming from different backgrounds and creating products that solve companies & people needs.You can find all of my latest projects on GitHub by visiting my profile at GitHub. Check them out to explore the diverse range of technologies and tools I've used. I'm always open to feedback and collaboration, so feel free to contact me , Happy coding! 🚀."
        />
        <Experience
          company="Tutor at CSC Annamalainagar branch"
          position="Tech Instructor."
          startDate="2023"
          endDate="2025"
          description="Conducted interactive coding classes for students of various skill levels.
Developed lesson plans and instructional materials to effectively teach coding concepts.
Provided guidance and support to students in their coding projects and assignments.
Monitored and assessed students' progress, providing feedback for improvement."
        />
      </div>
    </section>
  );
};

export default IndustryExperience;
