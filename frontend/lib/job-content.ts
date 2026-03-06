import type { Job } from "@/lib/types";

export type JobDescriptionSection = {
  heading?: string;
  paragraphs: string[];
  bullets: string[];
};

export type JobDescriptionFact = {
  label: string;
  value: string;
};

const SECTION_HEADINGS = new Set([
  "about",
  "about the role",
  "benefits",
  "compensation",
  "details",
  "how to apply",
  "key details",
  "key responsibilities",
  "location",
  "overview",
  "qualifications",
  "requirements",
  "responsibilities",
  "role overview",
  "status",
  "the role",
  "to apply",
  "what you'll be doing",
  "who we are looking for",
  "why join",
  "why join us",
]);

const EMOJI_BULLETS = ["📍", "🕓", "💼", "💰", "📧", "📌", "📞", "🗓", "📅", "🌐"];
const FACT_LABEL_BLOCKLIST = new Set([
  "details",
  "the role",
  "how to apply",
  "what you'll be doing",
  "who we are looking for",
  "why join",
  "why join us",
]);
const FACT_LABEL_ALLOWLIST = new Set([
  "location",
  "working hours",
  "salary",
  "start date",
  "website",
  "instagram",
  "employment type",
  "contract",
  "timezone",
  "language",
]);

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

function parseInlineHeading(line: string) {
  const match = line.match(/^([^:]{1,80}):\s*(.+)$/);
  if (!match) {
    return null;
  }

  const heading = match[1]?.trim();
  const content = match[2]?.trim();
  if (!heading || !content) {
    return null;
  }

  const normalizedHeading = heading.toLowerCase();
  const isKnownHeading = SECTION_HEADINGS.has(normalizedHeading);
  const shortHeading = heading.split(/\s+/).length <= 6 && heading.length <= 56;
  if (!isKnownHeading && !shortHeading) {
    return null;
  }

  if (FACT_LABEL_ALLOWLIST.has(normalizedHeading)) {
    return null;
  }

  return {
    heading,
    content,
  };
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
    const inlineHeading = parseInlineHeading(line);
    if (inlineHeading) {
      flushSection();
      current.heading = inlineHeading.heading;
      paragraphParts.push(inlineHeading.content);
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

  return "";
}

export function extractJobFacts(job: Job): JobDescriptionFact[] {
  const description = getJobDescription(job);
  const facts: JobDescriptionFact[] = [];
  const seen = new Set<string>();

  const lines = description
    .split("\n")
    .map((line) => normalizeLine(line).replace(/^- /, "").trim())
    .filter(Boolean);

  for (const line of lines) {
    const match = line.match(
      /^(?:[\p{Extended_Pictographic}]\s*)?([A-Za-z][A-Za-z0-9 &'()/.-]{1,40}):\s*(.+)$/u,
    );
    if (!match) {
      continue;
    }
    const label = match[1]?.trim();
    const value = match[2]?.trim();
    if (!label || !value) {
      continue;
    }

    const normalized = label.toLowerCase();
    if (FACT_LABEL_BLOCKLIST.has(normalized)) {
      continue;
    }

    const shouldInclude =
      FACT_LABEL_ALLOWLIST.has(normalized) ||
      normalized.includes("hour") ||
      normalized.includes("date") ||
      normalized.includes("location") ||
      normalized.includes("salary");

    if (!shouldInclude || seen.has(normalized)) {
      continue;
    }

    facts.push({ label, value });
    seen.add(normalized);
    if (facts.length >= 8) {
      break;
    }
  }

  return facts;
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
