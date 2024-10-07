import { Position } from "@/props";

const POR = () => {
  return (
    <section className="flex flex-col items-center justify-center mt-20">
      <h2 className="text-2xl font-bold text-secondary mb-3 text-left w-full">
        Worked With
      </h2>

      <div className="flex flex-wrap gap-10">
        <Position
          event="BUDDI AI , New York"
          position="Developer"
          startDate="2024"
          endDate="2025"
          description="I completed a project called GenEHR, which is designed for use in the medical field to manage health-related information."
        />

        <Position
          event="CSC Education , Tamil Nadu"
          position="Developer"
          startDate="2023"
          endDate="2024"
          description="I developed a comprehensive app for managing finance, student attendance, staff, and institution operations. The app simplifies tasks such as tracking student attendance, monitoring staff performance, and handling financial records. It also supports student management."
        />
      </div>
    </section>
  );
};

export default POR;
