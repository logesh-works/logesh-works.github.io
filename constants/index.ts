import type {
  Collaboration,
  EducationItem,
  ExperienceItem,
  SkillLayer,
  SocialLink,
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
  linkedin: "https://www.linkedin.com/in/logeshx/",
  site: "https://logeshkumar.in",
  summary:
    "Full-stack engineer with 3+ years of shipping production apps end to end, across startups, client work and teaching. I own a feature from the first schema to the release and the week after it: React and React Native on the front, Django and FastAPI behind, and a delivery process the team can trust.",
  statement:
    "I take products from idea to production and keep them healthy there: scoping the work, shaping the data and API contracts, building the web and mobile clients, and owning the road to release, from reviews and deploys to the fixes after launch.",
};

export const focusAreas = [
  { title: "End-to-end delivery", body: "From scoping and data model to release: one owner for the whole feature, not a hand-off chain." },
  { title: "Production-grade backends", body: "Django, FastAPI and PostgreSQL services with clear contracts, background workers and caching where it pays." },
  { title: "Web & mobile clients", body: "React, Next.js and React Native apps built on the same APIs, fast and accessible." },
  { title: "Shipping & operating", body: "Docker, Nginx and AWS deploys, Git workflows and code review, and staying on call for what ships." },
  { title: "Architecture when it matters", body: "Queues, events and microservices, used to solve a real scaling problem rather than for their own sake." },
  { title: "AI features & open source", body: "NLP-driven features in products, and MCP tooling other engineers install and use." },
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
  { label: "Instagram", handle: "@itslogesh", href: "https://www.instagram.com/itslogesh", icon: "instagram" },
];

/* ------------------------------------------------------------------ */
/* Experience                                                          */
/* ------------------------------------------------------------------ */

export const experience: ExperienceItem[] = [
  {
    company: "Cyces Innovation Labs LLP",
    role: "Software Development Engineer",
    location: "Chennai, TN",
    start: "Jan 2025",
    end: "Present",
    highlights: [
      "Design and build full-stack products end to end: data models and APIs on the backend, web and mobile clients on the front.",
      "Architect backend systems that scale, using event-driven workflows, message queues, background workers, caching and data synchronization.",
      "Tune performance across the stack, from frontend architecture to API and database queries.",
      "Own features with cross-functional teams from scoping to release: code review, deploys, and troubleshooting in production.",
    ],
  },
  {
    company: "Freelance",
    role: "Full-Stack Developer",
    location: "Remote",
    start: "Jan 2023",
    end: "Jan 2025",
    highlights: [
      "Delivered 15+ responsive websites for clients across industries; 80% repeat clients.",
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
    description: "Full-stack development on healthcare software.",
  },
  {
    organisation: "CSC Education, Tamil Nadu",
    role: "Developer",
    start: "2023",
    end: "2024",
    description: "Built internal operations software for an education institution.",
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
/* Writing                                                             */
/* ------------------------------------------------------------------ */

export const writing = {
  summary: "Technical writing from production work: performance, backends, tooling, and using AI well.",
  platforms: [
    { label: "Medium", handle: "@logii", href: "https://medium.com/@logii" },
    { label: "Substack", handle: "@unknowncoder", href: "https://substack.com/@unknowncoder" },
  ],
  /** An AI assistant trained on Logesh's work, to ask about it directly. */
  assistant: { name: "Logi", href: "https://ai.logeshkumar.in", host: "ai.logeshkumar.in" },
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
    role: "Cloud, DevOps & system design",
    tech: ["System design", "Architecture", "Infra design", "AWS", "Docker", "Kubernetes", "Nginx", "DigitalOcean", "Firebase", "Ubuntu"],
  },
  {
    id: "delivery",
    layer: "Delivery",
    role: "Shipping & operating",
    tech: ["Git workflows", "Code review", "Docker deploys", "AWS", "Agile delivery", "Client handover"],
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
  { id: "stack", label: "Stack" },
  { id: "experience", label: "Experience" },
  { id: "open-source", label: "Open source" },
  { id: "research", label: "Research" },
  { id: "writing", label: "Writing" },
  { id: "contact", label: "Contact" },
];

export const moreLinks = [
  { label: "Writing", href: "/blog" },
  { label: "GitHub activity", href: "/activities" },
];
