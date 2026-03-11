import { JobsSearchForm } from "@/components/public/JobsSearchForm";

export function HeroSearchForm() {
  return (
    <JobsSearchForm
      autoFocus
      buttonLabel="Search jobs"
      formClassName="hero-search"
      shellClassName="rounded-[1.6rem] border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.14)] p-2 backdrop-blur-[2px] sm:rounded-full"
      inputClassName="h-[60px] border-0 bg-transparent pr-5 text-base shadow-none ring-0 placeholder:text-[#727975]/70 focus-visible:ring-0 focus-visible:ring-offset-0"
      buttonClassName="h-[56px] rounded-full bg-[rgba(255,255,255,0.24)] px-6 text-base font-semibold hover:bg-[rgba(255,255,255,0.3)] sm:h-[60px]"
      errorClassName="px-4"
    />
  );
}
