import type { Job } from "@/lib/types";

export type JobDescriptionSection = {
  heading?: string;
  paragraphs: string[];
  bullets: string[];
};

const SECTION_HEADINGS = new Set([
  "about",
  "about the role",
  "benefits",
  "compensation",
  "how to apply",
  "key responsibilities",
  "location",
  "qualifications",
  "requirements",
  "responsibilities",
  "role overview",
  "status",
  "to apply",
]);

const EMOJI_BULLETS = ["📍", "🕓", "💼", "💰", "📧", "📌", "📞", "🗓", "📅", "🌐"];

function normalizeLine(line: string) {
  return line.replace(/\s+/g, " ").replace(/^[•●▪◦‣]\s*/, "- ").trim();
}

function isBulletLine(line: string) {
  if (!line) return false;
  if (/^(- |\* |• |● |▪ |◦ |‣ )/.test(line)) return true;
  if (/^\d+[.)]\s+/.test(line)) return true;
  return EMOJI_BULLETS.some((prefix) => line.startsWith(prefix)) && line.includes(":");
}

function isHeadingLine(line: string) {
  if (!line || isBulletLine(line)) return false;
  const normalized = line.replace(/:$/, "").trim().toLowerCase();
  if (SECTION_HEADINGS.has(normalized)) return true;
  return line.endsWith(":") && line.split(/\s+/).length <= 6 && line.length <= 80;
}

export function getJobDescription(job: Job) {
  return (job.description_mm || job.description_en || "").replace(/\r\n/g, "\n").trim();
}

export function parseJobDescription(text: string): JobDescriptionSection[] {
  const normalizedLines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map(normalizeLine);

  const sections: JobDescriptionSection[] = [];
  let current: JobDescriptionSection = { paragraphs: [], bullets: [] };
  let paragraphParts: string[] = [];

  function flushParagraph() {
    if (paragraphParts.length > 0) {
      current.paragraphs.push(paragraphParts.join(" ").trim());
      paragraphParts = [];
    }
  }

  function flushSection() {
    flushParagraph();
    if (current.heading || current.paragraphs.length > 0 || current.bullets.length > 0) {
      sections.push(current);
    }
    current = { paragraphs: [], bullets: [] };
  }

  for (const line of normalizedLines) {
    if (!line) {
      flushParagraph();
      continue;
    }
    if (isHeadingLine(line)) {
      flushSection();
      current.heading = line.replace(/:$/, "");
      continue;
    }
    if (isBulletLine(line)) {
      flushParagraph();
      current.bullets.push(line.replace(/^(\* |• |● |▪ |◦ |‣ )/, "- "));
      continue;
    }
    paragraphParts.push(line);
  }

  flushSection();
  return sections;
}

export function extractJobSummary(job: Job, limit = 220) {
  const sections = parseJobDescription(getJobDescription(job));

  for (const section of sections) {
    const paragraph = section.paragraphs[0];
    if (paragraph) return paragraph.slice(0, limit).trim();
  }

  for (const section of sections) {
    const bullet = section.bullets[0];
    if (bullet) return bullet.replace(/^- /, "").slice(0, limit).trim();
  }

  return "Curated opening with direct source details and a cleaner application path.";
}

export function buildFacebookPostMessage(job: Job) {
  const description = getJobDescription(job);
  const sections = parseJobDescription(description);
  const lines = [job.title, `${job.company} · ${job.location}`];

  if (job.employment_type) {
    lines.push(`🕓 Status: ${job.employment_type.replace(/-/g, " ")}`);
  }
  if (job.salary) {
    lines.push(`💰 Salary: ${job.salary}`);
  }

  const summary = extractJobSummary(job, 240);
  if (summary) {
    lines.push(summary);
  }

  for (const section of sections) {
    if (!section.heading) continue;
    const items = [...section.bullets];
    if (items.length === 0 && section.paragraphs[0]) {
      items.push(`- ${section.paragraphs[0]}`);
    }
    if (items.length === 0) continue;
    lines.push(section.heading);
    lines.push(...items.slice(0, 4));
    if (lines.length >= 16) break;
  }

  if (job.source_url) {
    lines.push(`Apply: ${job.source_url}`);
  }

  return lines.filter(Boolean).join("\n\n");
}
