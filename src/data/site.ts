export interface WorkExperience {
  company: string;
  role: string;
  logo: string;
  url: string;
}

export interface Education {
  institution: string;
  degree: string;
  logo: string;
  url: string;
}

export interface Project {
  title: string;
  description: string;
  links: { label: string; url: string }[];
}

export interface SocialLink {
  platform: string;
  url: string;
  label: string;
}

export const SITE = {
  name: "Will Tai",
  title: "Will Tai",
  description:
    "Machine learning engineer. Building things at scale, and the occasional side project nobody asked for.",
  url: "https://willt.ai",
  email: "wtaisen@gmail.com",
  tagline:
    "Building machine learning systems that scale, and the occasional side project nobody asked for.",
  photo: "/images/will.jpg",
} as const;

export const SOCIALS: SocialLink[] = [
  {
    platform: "GitHub",
    url: "https://github.com/willtai",
    label: "GitHub",
  },
  {
    platform: "LinkedIn",
    url: "https://www.linkedin.com/in/williamtai1/",
    label: "LinkedIn",
  },
  {
    platform: "X",
    url: "https://x.com/willtai_",
    label: "X",
  },
];

export const EXPERIENCE: WorkExperience[] = [
  {
    company: "Meta",
    role: "Machine Learning Engineer",
    logo: "/images/companies/meta.svg",
    url: "https://meta.com",
  },
  {
    company: "Neo4j",
    role: "Machine Learning Engineer",
    logo: "/images/companies/neo4j.jpg",
    url: "https://neo4j.com",
  },
  {
    company: "TrueLayer",
    role: "Machine Learning Engineer",
    logo: "/images/companies/truelayer.png",
    url: "https://truelayer.com",
  },
  {
    company: "Converge",
    role: "Data Scientist",
    logo: "/images/companies/converge.png",
    url: "https://converge.io",
  },
  {
    company: "Alpha-i",
    role: "Machine Learning Engineer",
    logo: "/images/companies/alphai.png",
    url: "",
  },
];

export const EDUCATION: Education[] = [
  {
    institution: "University of Cambridge",
    degree: "MEng Information and Computer Engineering",
    logo: "/images/companies/cambridge.svg",
    url: "",
  },
];

export const PROJECTS: Project[] = [
  {
    title: "Worduel",
    description:
      "Exercise your brain while vibecoding. Wordle, but in your terminal.",
    links: [
      { label: "npm", url: "https://www.npmjs.com/package/worduel" },
      { label: "GitHub", url: "https://github.com/willtai/worduel" },
    ],
  },
];
