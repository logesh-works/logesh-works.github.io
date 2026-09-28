import type {
  Collaboration,
  EducationItem,
  ExperienceItem,
  SkillLayer,
  SocialLink,
  SystemFlow,
} from "@/interfaces";

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

export const profile = {
  name: "Logesh Kumar",
  role: "Software Development Engineer",
  tagline: "Engineering products from ideas.",
  location: "Tamil Nadu, India",
  email: "logeshkumar.dev@gmail.com",
  phone: "+91 8870310183",
  phoneHref: "tel:+918870310183",
  github: "https://github.com/logesh-works",
  githubUser: "logesh-works",
  resume: "/resume.pdf",
  site: "https://logeshkumar.in",
  /** Optional key art behind the entry screen, e.g. "/images/engineer.jpg" once the file is in /public. */
  enterArt: null as string | null,
  summary:
    "Full-stack developer with 3+ years of hands-on experience in freelancing, startups, and teaching, focused on system design and low-latency APIs. A polyglot programmer who adapts quickly to new tech stacks and loves architecting scalable, real-world solutions.",
  intro: "I design distributed systems and low-latency APIs, then ship the product on top.",
  /** Core stack surfaced on the opening screen. */
  core: ["Python", "Django", "FastAPI", "PostgreSQL", "Redis", "RabbitMQ", "AWS"],
  statement:
    "I design the systems that hold products together: service boundaries, low-latency APIs, event-driven pipelines and the data synchronization between them, with enough full-stack range to ship the product on top.",
};

export const focusAreas = [
  { title: "System design & APIs", body: "Python, Django, FastAPI and REST services, designed for low-latency responses in production." },
  { title: "Distributed systems", body: "Microservices, event-driven architecture, queues and background workers." },
  { title: "Data synchronization", body: "Keeping external platforms and internal stores consistent." },
  { title: "Full-stack delivery", body: "React and React Native clients built on the same systems." },
  { title: "AI / NLP", body: "NLP-driven products and MCP tooling for developer workflows." },
  { title: "Open source", body: "Publishing tools other engineers can install and use." },
];

/** Facts from the original About page, kept as short notes. */
export const origins = [
  "Writing code since the age of 12",
  "Hands-on with DevOps and ethical hacking",
  "Advocate of open-source collaboration",
];

export const socials: SocialLink[] = [
  { label: "GitHub", handle: "@logesh-works", href: "https://github.com/logesh-works", icon: "github" },
  { label: "LinkedIn", handle: "logeshx", href: "https://www.linkedin.com/in/logeshx/", icon: "linkedin" },
  { label: "X", handle: "@zxlogi", href: "https://x.com/zxlogi", icon: "x" },
  { label: "Instagram", handle: "@zxlogi", href: "https://www.instagram.com/zxlogi", icon: "instagram" },
];

/* ------------------------------------------------------------------ */
/* Experience                                                          */
/* ------------------------------------------------------------------ */

/*
 * Client work at Cyces is under confidentiality, so it appears only as the
 * architecture patterns built, never client, vendor or product names, screens or data.
 */
const syncFlow: SystemFlow = {
  title: "Data synchronization platform",
  caption: "Keeping a third-party platform's data in sync with the backend",
  steps: [
    { label: "External platform", kind: "source" },
    { label: "Sync", kind: "service" },
    { label: "PostgreSQL", kind: "store" },
    { label: "Redis", kind: "store" },
    { label: "Celery", kind: "queue" },
    { label: "Backend", kind: "service" },
  ],
};

const eventFlow: SystemFlow = {
  title: "Event-driven delivery system",
  caption: "Order and dispatch flow across microservices",
  steps: [
    { label: "Order", kind: "source" },
    { label: "RabbitMQ", kind: "queue" },
    { label: "Microservices", kind: "service" },
    { label: "Dispatch", kind: "service" },
    { label: "Rider", kind: "service" },
    { label: "React Native", kind: "client" },
  ],
};

export const experience: ExperienceItem[] = [
  {
    company: "Cyces Innovation Labs LLP",
    role: "Software Development Engineer",
    location: "Chennai, TN",
    start: "Jan 2025",
    end: "Present",
    highlights: [
      "Design, develop and optimize backend and frontend systems for business products, working with cross-functional teams on features, troubleshooting and system efficiency.",
      "Developed and deployed 4+ scalable full-stack web apps (React, Django), reducing delivery time by 30%.",
      "Rebuilt frontend architecture using React and optimized APIs, improving performance and UX by 45%.",
    ],
    engagements: [
      { name: syncFlow.title, flow: syncFlow },
      { name: eventFlow.title, flow: eventFlow },
      { name: "GenEHR", context: "Healthcare AI, with BUDDI AI" },
    ],
  },
  {
    company: "Freelance",
    role: "Full-Stack Developer",
    location: "Remote",
    start: "Jan 2023",
    end: "Jan 2025",
    highlights: [
      "Delivered 15+ responsive websites for clients in education, retail, and food delivery; 80% repeat clients.",
      "Led a 5-member freelance team; managed client onboarding, dev cycles, Git workflows, and delivery timelines.",
      "Experimented with new technologies and worked with people from different backgrounds to build products that solve real needs.",
    ],
  },
  {
    company: "Computer Software College (CSC)",
    role: "Program Educator, Full-Stack Development",
    location: "Chidambaram, TN",
    start: "Jan 2022",
    end: "Jan 2025",
    highlights: [
      "Mentored 70+ students in web and backend development; 30% placed in tech companies or secured internships.",
      "Designed hands-on curriculum with real-world projects in React, Node, Django, and deployment workflows.",
      "Ran interactive coding classes across skill levels, guided student projects and assessed progress with feedback.",
    ],
  },
];

export const collaborations: Collaboration[] = [
  {
    organisation: "BUDDI AI, New York",
    role: "Developer",
    start: "2024",
    end: "2025",
    description: "Delivered GenEHR, a system for managing health-related information in the medical field.",
  },
  {
    organisation: "CSC Education, Tamil Nadu",
    role: "Developer",
    start: "2023",
    end: "2024",
    description: "Built an app for finance, student attendance, staff and institution operations.",
  },
];

/* ------------------------------------------------------------------ */
/* Open source                                                         */
/* ------------------------------------------------------------------ */

export const postmanMcp = {
  name: "Postman MCP",
  summary: "Generate and update Postman requests from your API code, from inside Claude Code.",
  /** The pipeline every sync command runs through (from the project README). */
  stages: [
    { label: "API source" },
    { label: "MCP" },
    { label: "Validate" },
    { label: "Verify" },
    { label: "Diff" },
    { label: "Confirm" },
    { label: "Postman collection" },
  ],
  facts: ["Python", "MIT license", "Published on PyPI", "7 slash commands", "Collection v2.1"],
  install: "pip install postman-mcp",
  links: {
    github: "https://github.com/logesh-works/postman-mcp",
    docs: "https://logesh-works.github.io/postman-mcp/",
    pypi: "https://pypi.org/project/postman-mcp/",
  },
};

/* ------------------------------------------------------------------ */
/* Research                                                            */
/* ------------------------------------------------------------------ */

export const award = {
  title: "Best Paper Award",
  event: "ICA6NT 2026",
  paper: "Review of Artificial Intelligence Techniques in the Design of Printed Antennas",
};

/* ------------------------------------------------------------------ */
/* Skills, as layers of a system                                       */
/* ------------------------------------------------------------------ */

export const skillLayers: SkillLayer[] = [
  {
    id: "client",
    layer: "Client",
    role: "Frontend & mobile",
    tech: ["React", "Next.js", "React Native", "Expo", "Redux", "TypeScript", "Tailwind CSS", "HTML", "CSS"],
  },
  {
    id: "api",
    layer: "API",
    role: "Backend services",
    tech: ["Python", "Django", "FastAPI", "Flask", "REST APIs", "Node.js", "Express"],
  },
  {
    id: "async",
    layer: "Async",
    role: "Architecture & messaging",
    tech: ["Microservices", "Event-driven architecture", "RabbitMQ", "Celery", "Data synchronization", "System design"],
  },
  {
    id: "data",
    layer: "Data",
    role: "Databases & caching",
    tech: ["PostgreSQL", "Redis", "MySQL", "MongoDB"],
  },
  {
    id: "infra",
    layer: "Infra",
    role: "Cloud & DevOps",
    tech: ["AWS", "Docker", "Nginx", "Kubernetes", "DigitalOcean", "Firebase", "Ubuntu"],
  },
  {
    id: "intelligence",
    layer: "AI",
    role: "AI / NLP",
    tech: ["NLP", "Hugging Face", "MCP", "AI application development"],
  },
];

export const toolbelt = {
  languages: ["Python", "JavaScript", "TypeScript", "Java", "C", "C++"],
  tools: ["Git", "GitHub", "Postman", "VS Code", "Windows", "Ubuntu"],
};

/* ------------------------------------------------------------------ */
/* Education                                                           */
/* ------------------------------------------------------------------ */

export const education: EducationItem[] = [
  {
    institute: "Annamalai University, Faculty of Engineering & Technology, Chidambaram",
    degree: "B.E. Information Technology",
    start: "2021",
    end: "2025",
    score: "82.2%",
  },
  {
    institute: "MSP Solai Nadar Memorial Higher Secondary School, TN",
    degree: "Grade 12",
    start: "Apr 2020",
    end: "Mar 2021",
    score: "88.6%",
  },
  {
    institute: "MSP Solai Nadar Memorial Higher Secondary School, TN",
    degree: "Grade 10",
    start: "Apr 2018",
    end: "Mar 2019",
    score: "88.4%",
  },
];

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

/** Chapters of the single-page journey, in scroll order. */
export const chapters = [
  { id: "top", label: "Home" },
  { id: "about", label: "About" },
  { id: "stack", label: "Systems" },
  { id: "experience", label: "Experience" },
  { id: "open-source", label: "Open source" },
  { id: "research", label: "Research" },
  { id: "contact", label: "Contact" },
];

export const moreLinks = [
  { label: "Writing", href: "/blog" },
  { label: "GitHub activity", href: "/activities" },
  { label: "Memories", href: "/memories" },
];
