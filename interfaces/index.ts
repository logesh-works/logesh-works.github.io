export interface Link {
  label: string;
  href: string;
}

export interface SocialLink extends Link {
  handle: string;
  icon: "github" | "linkedin" | "x" | "instagram" | "mail" | "phone";
}

/** A step in an engineering flow diagram. */
export interface FlowStep {
  label: string;
  kind?: "source" | "queue" | "store" | "service" | "client" | "check";
}

export interface SystemFlow {
  title: string;
  caption: string;
  steps: FlowStep[];
}

export interface Engagement {
  name: string;
  context?: string;
  flow?: SystemFlow;
}

export interface ExperienceItem {
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  highlights: string[];
  engagements?: Engagement[];
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
