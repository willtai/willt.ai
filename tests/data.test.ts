import { describe, it, expect } from "vitest";
import { SITE, SOCIALS, EXPERIENCE, EDUCATION, PROJECTS } from "../src/data/site";

describe("SITE config", () => {
  it("has required fields", () => {
    expect(SITE.name).toBe("Will Tai");
    expect(SITE.url).toBe("https://willt.ai");
    expect(SITE.email).toMatch(/@/);
    expect(SITE.tagline).toBeTruthy();
    expect(SITE.photo).toBeTruthy();
  });

  it("uses HTTPS for the site URL", () => {
    expect(SITE.url).toMatch(/^https:\/\//);
  });
});

describe("SOCIALS", () => {
  it("has at least one social link", () => {
    expect(SOCIALS.length).toBeGreaterThan(0);
  });

  it("every social has platform, url, and label", () => {
    for (const social of SOCIALS) {
      expect(social.platform).toBeTruthy();
      expect(social.url).toMatch(/^https:\/\//);
      expect(social.label).toBeTruthy();
    }
  });

  it("includes GitHub, LinkedIn, and X", () => {
    const platforms = SOCIALS.map((s) => s.platform);
    expect(platforms).toContain("GitHub");
    expect(platforms).toContain("LinkedIn");
    expect(platforms).toContain("X");
  });
});

describe("EXPERIENCE", () => {
  it("has at least one entry", () => {
    expect(EXPERIENCE.length).toBeGreaterThan(0);
  });

  it("every entry has company, role, and logo", () => {
    for (const exp of EXPERIENCE) {
      expect(exp.company).toBeTruthy();
      expect(exp.role).toBeTruthy();
      expect(exp.logo).toBeTruthy();
    }
  });

  it("entries with a url use HTTPS", () => {
    for (const exp of EXPERIENCE) {
      if (exp.url) {
        expect(exp.url).toMatch(/^https:\/\//);
      }
    }
  });

  it("does not include seniority ranks in role titles", () => {
    const rankPatterns = /\b(Senior|Staff|Principal|Lead|Junior|Intern)\b/i;
    for (const exp of EXPERIENCE) {
      expect(exp.role).not.toMatch(rankPatterns);
    }
  });

  it("lists Meta as the first (most recent) company", () => {
    expect(EXPERIENCE[0].company).toBe("Meta");
  });

  it("has all five companies", () => {
    const companies = EXPERIENCE.map((e) => e.company);
    expect(companies).toEqual(["Meta", "Neo4j", "TrueLayer", "Converge", "Alpha-i"]);
  });
});

describe("EDUCATION", () => {
  it("has at least one entry", () => {
    expect(EDUCATION.length).toBeGreaterThan(0);
  });

  it("every entry has institution, degree, and logo", () => {
    for (const edu of EDUCATION) {
      expect(edu.institution).toBeTruthy();
      expect(edu.degree).toBeTruthy();
      expect(edu.logo).toBeTruthy();
    }
  });

  it("includes Cambridge", () => {
    const institutions = EDUCATION.map((e) => e.institution);
    expect(institutions).toContain("University of Cambridge");
  });
});

describe("PROJECTS", () => {
  it("has at least one project", () => {
    expect(PROJECTS.length).toBeGreaterThan(0);
  });

  it("every project has title, description, and links", () => {
    for (const project of PROJECTS) {
      expect(project.title).toBeTruthy();
      expect(project.description).toBeTruthy();
      expect(project.links.length).toBeGreaterThan(0);
    }
  });

  it("every project link has a label and valid URL", () => {
    for (const project of PROJECTS) {
      for (const link of project.links) {
        expect(link.label).toBeTruthy();
        expect(link.url).toMatch(/^https:\/\//);
      }
    }
  });
});
