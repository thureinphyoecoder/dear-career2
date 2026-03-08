import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  FileText,
  LayoutTemplate,
  PenSquare,
  Sparkles,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { absoluteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

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

const templateCards = [
  {
    name: "Modern Professional",
    fit: "Marketing, Operations, Customer Success",
    accent: "from-[#9fb6a5] via-[#f7f3ec] to-[#e8eeea]",
    summary: [
      "Customer Success Lead with 6+ years of experience in SaaS onboarding and retention.",
      "Specialized in reducing churn through lifecycle strategy and cross-functional execution.",
    ],
    skills: [
      "Tools: HubSpot, Salesforce, Notion",
      "Data: SQL basics, Looker Studio",
      "Workflow: KPI tracking, onboarding playbooks",
    ],
    experience: [
      "Increased product adoption by 34% through onboarding redesign.",
      "Managed 80+ enterprise accounts with 92% renewal rate.",
    ],
    education: "B.B.A, Assumption University",
  },
  {
    name: "Minimal Executive",
    fit: "Manager, Lead, Senior Specialist",
    accent: "from-[#4f6354] via-[#e0e9e3] to-[#f3f6f4]",
    summary: [
      "Operations Manager with 9+ years of experience in team leadership and process optimization.",
      "Focused on lowering operating costs while improving delivery speed.",
    ],
    skills: [
      "Management: Team leadership, hiring, coaching",
      "Systems: ERP, dashboard reporting, SOP design",
      "Planning: Budgeting, vendor negotiation, forecasting",
    ],
    experience: [
      "Reduced monthly operating costs by 21% via process redesign.",
      "Developed SOPs that cut onboarding time from 4 weeks to 2 weeks.",
    ],
    education: "M.B.A, Chulalongkorn University",
  },
  {
    name: "Creative Lean",
    fit: "Design, Product, Social Media",
    accent: "from-[#d8c7a5] via-[#f5efe3] to-[#f7f3ec]",
    summary: [
      "Product Designer with 5+ years creating UX for web and mobile products.",
      "Known for improving conversion through user research and rapid prototyping.",
    ],
    skills: [
      "Design: Figma, Design Systems, Wireframing",
      "Research: User interviews, usability testing",
      "Delivery: Handoff, A/B testing collaboration",
    ],
    experience: [
      "Improved signup conversion by 18% after checkout flow redesign.",
      "Collaborated with frontend and backend teams to launch 12+ features.",
    ],
    education: "B.Des, Rangsit University",
  },
];

export default function CvGuidePage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 pt-32">
      <header className="relative overflow-hidden rounded-[2rem] border border-[rgba(112,134,118,0.2)] bg-[linear-gradient(135deg,rgba(248,251,249,0.98),rgba(245,239,230,0.84))] p-6 sm:p-10">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(159,182,165,0.32),transparent_70%)]" />
        <div className="absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(216,199,165,0.3),transparent_70%)]" />
        <div className="relative grid gap-5">
          <div className="text-xs uppercase tracking-[0.16em] text-[#6e8b77]">Career Toolkit</div>
          <h1 className="m-0 max-w-[18ch] font-serif text-[clamp(2.2rem,4vw,4rem)] leading-[0.92] tracking-[-0.035em] text-[#2f3833]">
            CV Guide + Ready-to-Use Templates
          </h1>
          <p className="m-0 max-w-[62ch] text-[0.98rem] leading-7 text-[#57635c]">
            AI generated design လို generic မဖြစ်အောင် recruiter ဖတ်ရလွယ်တဲ့ structure နဲ့ template previews တွေကို တစ်နေရာတည်းမှာကြည့်နိုင်အောင် ပြင်ထားပါတယ်။
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(112,134,118,0.24)] bg-white/80 px-3 py-1.5 text-xs uppercase tracking-[0.13em] text-[#4f6354]">
              <LayoutTemplate className="h-3.5 w-3.5" />
              3 CV templates
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(112,134,118,0.24)] bg-white/80 px-3 py-1.5 text-xs uppercase tracking-[0.13em] text-[#4f6354]">
              <Sparkles className="h-3.5 w-3.5" />
              ATS friendly
            </span>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="grid gap-2 rounded-[1.5rem] border border-[rgba(160,183,164,0.16)] bg-white/90 p-5">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#8da693]">
            <LayoutTemplate className="h-4 w-4" />
            CV Design
          </div>
          <p className="m-0 text-sm leading-7 text-[#5e6662]">
            Keep one page, clear spacing, and strong section hierarchy.
          </p>
        </article>
        <article className="grid gap-2 rounded-[1.5rem] border border-[rgba(160,183,164,0.16)] bg-white/90 p-5">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#8da693]">
            <PenSquare className="h-4 w-4" />
            CV Writing
          </div>
          <p className="m-0 text-sm leading-7 text-[#5e6662]">
            Write action-driven bullets with measurable impact.
          </p>
        </article>
        <article className="grid gap-2 rounded-[1.5rem] border border-[rgba(160,183,164,0.16)] bg-white/90 p-5">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#8da693]">
            <FileText className="h-4 w-4" />
            Final Check
          </div>
          <p className="m-0 text-sm leading-7 text-[#5e6662]">
            Match job keywords, remove errors, and export as PDF.
          </p>
        </article>
      </section>

      <section className="grid gap-4 rounded-[1.8rem] border border-[rgba(112,134,118,0.18)] bg-[rgba(255,255,255,0.9)] p-6 sm:p-8">
        <div className="flex items-end justify-between gap-4">
          <div className="grid gap-2">
            <h2 className="m-0 text-[1.28rem] font-semibold text-[#334039]">CV Template Gallery</h2>
            <p className="m-0 text-sm text-[#5e6662]">Pick a template by role type and replace the demo text with your own experience.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {templateCards.map((template) => (
            <article
              key={template.name}
              className="group grid gap-4 rounded-[1.4rem] border border-[rgba(112,134,118,0.18)] bg-[#fcfcfb] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-24px_rgba(47,63,53,0.55)]"
            >
              <div className={cn("rounded-[1rem] border border-[rgba(112,134,118,0.16)] bg-gradient-to-br p-3", template.accent)}>
                <div className="grid gap-2 rounded-[0.7rem] bg-white/95 p-3 text-[0.62rem] leading-4 text-[#4d5b53] shadow-[0_10px_18px_-16px_rgba(36,48,42,0.6)]">
                  <p className="m-0 font-semibold uppercase tracking-[0.08em] text-[#2f3833]">Name Surname | Phone | Email</p>
                  <div className="grid gap-1">
                    <p className="m-0 font-semibold uppercase tracking-[0.08em] text-[#2f3833]">Summary</p>
                    {template.summary.map((line) => (
                      <p key={line} className="m-0">
                        {line}
                      </p>
                    ))}
                  </div>
                  <div className="grid gap-1">
                    <p className="m-0 font-semibold uppercase tracking-[0.08em] text-[#2f3833]">Skills</p>
                    {template.skills.map((line) => (
                      <p key={line} className="m-0">
                        {line}
                      </p>
                    ))}
                  </div>
                  <div className="grid gap-1">
                    <p className="m-0 font-semibold uppercase tracking-[0.08em] text-[#2f3833]">Experience</p>
                    {template.experience.map((line) => (
                      <p key={line} className="m-0">
                        • {line}
                      </p>
                    ))}
                  </div>
                  <p className="m-0 font-semibold uppercase tracking-[0.08em] text-[#2f3833]">Education: {template.education}</p>
                </div>
              </div>

              <div className="grid gap-2">
                <h3 className="m-0 text-[1.03rem] font-semibold text-[#2f3833]">{template.name}</h3>
                <p className="m-0 text-xs uppercase tracking-[0.13em] text-[#6c8574]">Best for: {template.fit}</p>
              </div>

              <ul className="m-0 grid gap-1.5 pl-5 text-sm leading-6 text-[#5a6760]">
                <li>Summary below contact and limited to 2-3 lines</li>
                <li>Skills grouped with JD-aligned keywords</li>
                <li>Experience bullets start with action + result metrics</li>
                <li>Single-column ATS-safe order: Summary, Skills, Experience, Education</li>
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-[1.8rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.86)] p-6 sm:p-8">
        <h2 className="m-0 text-[1.2rem] font-semibold text-[#334039]">Summary & Skills (ATS Friendly)</h2>
        <ul className="m-0 grid gap-2 pl-5 text-sm leading-7 text-[#5e6662]">
          <li>နာမည်နဲ့ contact အောက်က Summary ကို 2-3 ကြောင်းထက်မပိုအောင်ရေးပါ။</li>
          <li>
            Generic sentence မသုံးပါနဲ့: <span className="italic">I am a hardworking professional...</span>
          </li>
          <li>အစားထိုးပြီး problem-solving value ကိုအဓိကရေးပါ။</li>
          <li>Skills ကို စာကြောင်းရှည်ကြီးမဟုတ်ဘဲ category အလိုက်ခွဲရေးပါ။</li>
          <li>Job Description ထဲက keyword တွေကို တိုက်ရိုက်ပြန်သုံးပါ။</li>
        </ul>
        <div className="rounded-xl border border-[rgba(160,183,164,0.2)] bg-[rgba(247,243,236,0.75)] p-4 text-sm leading-7 text-[#4f5e56]">
          <p className="m-0 font-semibold text-[#334039]">Summary example</p>
          <p className="m-0">
            Software Engineer with 8+ years of experience in building scalable systems. Expert in optimizing performance and ensuring security compliance for high-traffic platforms.
          </p>
        </div>
        <div className="rounded-xl border border-[rgba(160,183,164,0.2)] bg-white/90 p-4 text-sm leading-7 text-[#4f5e56]">
          <p className="m-0 font-semibold text-[#334039]">Skills format example</p>
          <p className="m-0">Languages: JavaScript (ES6+), TypeScript, HTML5, CSS3/SCSS</p>
          <p className="m-0">Frontend: React.js, Next.js, Vue/Angular</p>
          <p className="m-0">Logic & Data: REST APIs, JSON, Redux, Zustand, Context API</p>
          <p className="m-0">UI Libraries: Tailwind CSS, Material UI, Bootstrap</p>
        </div>
      </section>

      <section className="grid gap-4 rounded-[1.8rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(247,243,236,0.64)] p-6 sm:p-8">
        <h2 className="m-0 text-[1.2rem] font-semibold text-[#334039]">Experience Writing Rules</h2>
        <ul className="m-0 grid gap-2 pl-5 text-sm leading-7 text-[#5e6662]">
          <li>နောက်ဆုံးလုပ်ခဲ့တဲ့အလုပ်ကို အပေါ်ဆုံး (reverse chronological) ထားပါ။</li>
          <li>
            Soft skill ကို သီးသန့်မရေးဘဲ experience ထဲထည့်ပါ:
            <span className="italic"> Collaborated with UI/UX designers and backend team...</span>
          </li>
          <li>Action verbs နဲ့စပါ: Managed, Developed, Increased</li>
          <li>Bullet points သုံးပြီး paragraph အရှည်ကြီးတွေကိုရှောင်ပါ။</li>
          <li>ဘာလုပ်ခဲ့လဲထက် ဘာအောင်မြင်ခဲ့လဲ + metrics ကိုဦးစားပေးပါ။</li>
        </ul>
        <div className="rounded-xl border border-[rgba(160,183,164,0.2)] bg-white/90 p-4 text-sm leading-7 text-[#4f5e56]">
          <p className="m-0 font-semibold text-[#334039]">Impact-focused bullet example</p>
          <p className="m-0">
            Integrated Zustand for state management, reducing boilerplate code by 30% and optimizing application performance.
          </p>
        </div>
      </section>

      <section className="grid gap-4 rounded-[1.8rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.9)] p-6 sm:p-8">
        <h2 className="m-0 text-[1.2rem] font-semibold text-[#334039]">Simple Layout Wins</h2>
        <div className="grid gap-2 text-sm leading-7 text-[#5e6662]">
          <p className="m-0 inline-flex items-start gap-2">
            <CheckCircle2 className="mt-1 h-4 w-4 text-[#7f9685]" />Single-column layout သုံးပါ။ ATS က two-column, table layout တွေကို မကြာခဏဖတ်မရနိုင်ပါ။
          </p>
          <p className="m-0 inline-flex items-start gap-2">
            <CheckCircle2 className="mt-1 h-4 w-4 text-[#7f9685]" />Font: Arial, Calibri, Helvetica (10-12 pt)
          </p>
          <p className="m-0 inline-flex items-start gap-2">
            <CheckCircle2 className="mt-1 h-4 w-4 text-[#7f9685]" />Section headers ကိုရိုးရိုးသုံးပါ: Experience, Skills, Education
          </p>
          <p className="m-0 inline-flex items-start gap-2">
            <CheckCircle2 className="mt-1 h-4 w-4 text-[#7f9685]" />Avoid: photos, heavy icons, graphs, progress bars (Skill 80% style)
          </p>
        </div>
      </section>

      <section className="grid gap-4 rounded-[1.8rem] border border-[rgba(112,134,118,0.2)] bg-[rgba(250,251,249,0.95)] p-6 sm:p-8">
        <h2 className="m-0 text-[1.2rem] font-semibold text-[#334039]">Role-by-Role CV Strategy</h2>
        <ul className="m-0 grid gap-2 pl-5 text-sm leading-7 text-[#5e6662]">
          <li>CV တစ်စောင်တည်းနဲ့ အလုပ်အားလုံးမလျှောက်ပါနဲ့။ Role တိုင်း JD မတူပါ။</li>
          <li>Master CV အရှည်တစ်စောင်ထားပါ (skills + experience အကုန်ပါ).</li>
          <li>Apply မလုပ်ခင် JD မဆိုင်တာဖြုတ်၊ ဆိုင်တာကို ထိပ်ဆုံးတင်ပြီး file အသစ်save လုပ်ပါ။</li>
          <li>Recommended filename: name_position.pdf or name_position_company.pdf</li>
          <li>မရှိတာမရေးဘဲ ရှိပြီးသားထဲက relevant evidence ကိုရွေးထုတ်ပြပါ။</li>
        </ul>
        <p className="m-0 text-sm leading-7 text-[#5e6662]">
          Optional tools like Rezi, Teal, FlowCV, Wobo can help with keyword checks. Free plans usually have limits, so you can score-check there and finalize in Word/Docs.
        </p>
      </section>

      <section className="grid gap-4 rounded-[1.8rem] border border-[rgba(112,134,118,0.2)] bg-[linear-gradient(140deg,rgba(245,251,247,0.95),rgba(255,255,255,0.9))] p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#6f8977]">
          <BellRing className="h-4 w-4" />
          Create Job Alert
        </div>
        <h2 className="m-0 text-[1.2rem] font-semibold text-[#334039]">New jobs မလွတ်အောင် alert setup လုပ်ပါ</h2>
        <p className="m-0 text-sm leading-7 text-[#5e6662]">
          Target role keywords (eg. Frontend, React, TypeScript) နဲ့ location အလိုက် job results ကို save လုပ်ထားပြီး
          နေ့စဉ်စစ်ပါ။ Job Alert automation feature ကိုလိုချင်ရင် request ပေးလို့ရပါတယ်။
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/jobs?q=frontend%20react%20typescript" className={cn(buttonVariants(), "rounded-xl px-5")}>
            Browse Jobs with Keywords
          </Link>
          <Link href="/feedback" className={cn(buttonVariants({ variant: "secondary" }), "rounded-xl px-5")}>
            Request Job Alert Feature
          </Link>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3 rounded-[1.8rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.88)] p-6">
        <Link href="/jobs" className={cn(buttonVariants(), "rounded-xl px-5")}>
          Browse Jobs
        </Link>
        <Link href="/feedback" className={cn(buttonVariants({ variant: "secondary" }), "rounded-xl px-5")}>
          Request CV Template Download
        </Link>
        <Link href="/feedback" className="inline-flex items-center gap-2 px-2 text-sm font-medium text-[#4f6354] transition hover:text-[#2f3f35]">
          Ask for custom format
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
