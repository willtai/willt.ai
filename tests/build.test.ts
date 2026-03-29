import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const distDir = resolve(import.meta.dirname, "..", "dist");
const indexPath = resolve(distDir, "index.html");

describe("production build", () => {
  beforeAll(() => {
    execSync("npm run build", {
      cwd: resolve(import.meta.dirname, ".."),
      stdio: "pipe",
    });
  }, 30000);

  it("generates index.html", () => {
    expect(existsSync(indexPath)).toBe(true);
  });

  it("includes JSON-LD structured data", () => {
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain('type="application/ld+json"');
    const match = html.match(
      /<script type="application\/ld\+json">(.*?)<\/script>/s
    );
    expect(match).not.toBeNull();
    const jsonLd = JSON.parse(match![1]);
    expect(jsonLd["@type"]).toBe("Person");
    expect(jsonLd.name).toBe("Will Tai");
    expect(jsonLd.worksFor.name).toBe("Meta");
  });

  it("includes Open Graph meta tags", () => {
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain('property="og:type"');
  });

  it("includes Twitter card meta tags", () => {
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain('name="twitter:card"');
    expect(html).toContain('name="twitter:site"');
  });

  it("includes all experience entries", () => {
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain("Meta");
    expect(html).toContain("Neo4j");
    expect(html).toContain("TrueLayer");
    expect(html).toContain("Converge");
    expect(html).toContain("Alpha-i");
  });

  it("includes the Worduel project", () => {
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain("Worduel");
    expect(html).toContain("worduel");
  });

  it("includes contact email", () => {
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain("wtaisen@gmail.com");
  });

  it("ships zero separate JS files", () => {
    const jsFiles = existsSync(resolve(distDir, "_astro"))
      ? execSync(`find ${resolve(distDir, "_astro")} -name "*.js" 2>/dev/null`)
          .toString()
          .trim()
      : "";
    expect(jsFiles).toBe("");
  });

  it("includes robots.txt", () => {
    expect(existsSync(resolve(distDir, "robots.txt"))).toBe(true);
  });

  it("includes favicon", () => {
    expect(existsSync(resolve(distDir, "favicon.svg"))).toBe(true);
  });
});
