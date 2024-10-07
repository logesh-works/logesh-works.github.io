// props
import { EducationField } from "@/props";

const Education = () => {
  return (
    <section className="flex flex-col items-center justify-center mt-20">
      <h2 className="text-2xl font-bold text-secondary mb-3 text-left w-full">Education</h2>

      <div className="flex flex-wrap gap-7">
        <EducationField
          institute="Annamalai university faculty of engineering and technology, TN"
          degree="Bachelor of engineering & IT"
          startDate="AUG 2021"
          endDate="MAY 2025"
          percentage={84.5}
        />

        <EducationField
          institute="MSP Solai Nadar Memoriable Higher secondary Education School, TN"
          degree="Grade 12"
          startDate="APR 2020"
          endDate="MAR 2021"
          percentage={88.6}
        />

        <EducationField
          institute="MSP Solai Nadar Memoriable Higher secondary Education School, TN"
          degree="Grade 10"
          startDate="APR 2018"
          endDate="MAR 2019"
          percentage={88.4}
        />
      </div>
    </section>
  );
};

export default Education;
