import type { Metadata } from "next";
import Link from "next/link";

import { absoluteUrl } from "@/lib/seo";
import { getPublicCvGuideContent } from "@/lib/api-public";

export const metadata: Metadata = {
  title: "CV Guide",
  description: "Professional CV design and CV writing guide for jobs in Thailand.",
  alternates: {
    canonical: "/cv-guide",
  },
  openGraph: {
    type: "article",
    url: absoluteUrl("/cv-guide"),
    title: "CV Guide | Dear Career",
    description: "Professional CV design and CV writing guide for jobs in Thailand.",
  },
};

const cvTemplates = [
  {
    tag: "Modern ATS",
    name: "Single Column Standard",
    description:
      "Summary, Skills, Experience, Education ကို ATS-safe order နဲ့ ရိုးရှင်းစွာစီထားတဲ့ format.",
    accent: "bg-[#5f7a67]",
    useFor: "Junior to Mid level",
  },
  {
    tag: "Modern ATS",
    name: "Impact Focused",
    description:
      "Action verb + metric result bullet တွေကို ဦးစားပေးထားတဲ့ experienced role template.",
    accent: "bg-[#6f876f]",
    useFor: "Mid to Senior level",
  },
  {
    tag: "Modern ATS",
    name: "Role Tailored",
    description:
      "JD keyword တွေကို role အလိုက်ပြောင်းထည့်ဖို့ optimize လုပ်ထားတဲ့ version.",
    accent: "bg-[#7d8c73]",
    useFor: "Role specific apply",
  },
] as const;

function splitGuideSections(guideText: string) {
  const lines = guideText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const sections: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    if (line.startsWith("✅")) {
      if (current) sections.push(current);
      current = {
        title: line.replace(/^✅\s*/, "").trim(),
        lines: [],
      };
      continue;
    }

    if (!current) {
      current = { title: "CV Guide", lines: [] };
    }
    current.lines.push(line);
  }

  if (current) sections.push(current);
  return sections;
}

export default async function CvGuidePage() {
  const content = await getPublicCvGuideContent();

  const title = content?.title || "CV Guide: Design Better, Write Clearer";
  const intro =
    content?.intro ||
    "Use this guide to build a clean CV that recruiters can scan quickly and trust.";
  const sections = splitGuideSections(content?.guide_text || "");

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 pb-20 pt-32">
      <header className="grid gap-3 rounded-[1.7rem] border border-[rgba(160,183,164,0.2)] bg-white p-6 sm:p-8">
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Career Toolkit</div>
        <h1 className="m-0 font-serif text-[clamp(2rem,3.4vw,3.4rem)] leading-[0.96] tracking-[-0.03em] text-[#334039]">
          {title}
        </h1>
        <p className="m-0 max-w-[72ch] text-sm leading-7 text-[#5f6b64]">{intro}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {cvTemplates.map((template, index) => (
          <article key={template.name} className="grid gap-3 rounded-2xl border border-[rgba(160,183,164,0.2)] bg-white p-5">
            <p className="m-0 text-xs uppercase tracking-[0.16em] text-[#8da693]">Template {index + 1}</p>
            <h2 className="m-0 text-base font-semibold text-[#334039]">{template.name}</h2>
            <div className="rounded-xl border border-[rgba(160,183,164,0.2)] bg-[#fbfcfb] p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${template.accent}`} />
                <span className="text-[10px] uppercase tracking-[0.14em] text-[#6e7b73]">{template.tag}</span>
              </div>
              <div className="grid gap-1.5 text-[10px] leading-4 text-[#4e5c55]">
                <p className="m-0 font-semibold uppercase tracking-[0.09em]">Name Surname | Phone | Email</p>
                <p className="m-0 font-semibold uppercase tracking-[0.09em]">Summary</p>
                <p className="m-0">Software Engineer with 5+ years of experience in scalable web apps.</p>
                <p className="m-0 font-semibold uppercase tracking-[0.09em]">Skills</p>
                <p className="m-0">React, Next.js, TypeScript, REST APIs, Tailwind CSS</p>
                <p className="m-0 font-semibold uppercase tracking-[0.09em]">Experience</p>
                <p className="m-0">• Developed admin dashboard, reduced task time by 30%.</p>
                <p className="m-0">• Collaborated with design/backend to ship 10+ features.</p>
                <p className="m-0 font-semibold uppercase tracking-[0.09em]">Education</p>
              </div>
            </div>
            <p className="m-0 text-xs uppercase tracking-[0.14em] text-[#7d8a82]">Best for: {template.useFor}</p>
            <p className="m-0 text-sm leading-7 text-[#5f6b64]">{template.description}</p>
          </article>
        ))}
      </section>

      {sections.map((section) => (
        <section
          key={section.title}
          className="grid gap-3 rounded-[1.5rem] border border-[rgba(160,183,164,0.2)] bg-white p-6"
        >
          <h2 className="m-0 text-[1.08rem] font-semibold text-[#334039]">{section.title}</h2>
          <div className="grid gap-2 text-sm leading-7 text-[#5f6b64]">
            {section.lines.map((line, index) => (
              <p key={`${section.title}-${index}`} className="m-0">
                {line}
              </p>
            ))}
          </div>
        </section>
      ))}

      <section className="flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-[rgba(160,183,164,0.2)] bg-white p-6">
        <Link
          href="/jobs?q=frontend%20react%20typescript"
          className="inline-flex h-11 items-center rounded-xl bg-[#5f7a67] px-5 text-sm font-semibold text-white transition hover:bg-[#506a59]"
        >
          Browse Jobs with Keywords
        </Link>
        <Link
          href="/feedback"
          className="inline-flex h-11 items-center rounded-xl border border-[rgba(160,183,164,0.3)] px-5 text-sm font-semibold text-[#334039] transition hover:bg-[rgba(160,183,164,0.08)]"
        >
          Request CV / Job Alert Update
        </Link>
      </section>
    </main>
  );
}
