export interface Link {
  label: string;
  href: string;
}

export interface SocialLink extends Link {
  handle: string;
  icon: "github" | "linkedin" | "x" | "instagram" | "mail" | "phone";
}

export interface ExperienceItem {
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  highlights: string[];
}

export interface Collaboration {
  organisation: string;
  role: string;
  start: string;
  end: string;
  description: string;
}

export interface SkillLayer {
  id: string;
  layer: string;
  role: string;
  tech: string[];
}

export interface EducationItem {
  institute: string;
  degree: string;
  start: string;
  end: string;
  score: string;
}
