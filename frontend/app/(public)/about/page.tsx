export default function PublicAboutPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-32">
      <section className="grid gap-3 border-b border-[rgba(160,183,164,0.16)] pb-6">
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">About Dear Career</div>
        <h1 className="m-0 font-serif text-[clamp(2.2rem,4vw,4.2rem)] font-medium leading-[0.96] tracking-[-0.04em] text-foreground">
          A cleaner way to discover jobs in Thailand
        </h1>
        <p className="mb-0 max-w-[58ch] text-[1.08rem] leading-8 text-[#727975]">
          Dear Career က Thailand jobs opportunities တွေကို တစ်နေရာထဲမှာ စုစည်းပေးထားတဲ့ curated website တစ်ခုပါ။
          Website ထဲကနေတိုက်ရိုက် လျှောက်ရတာမဟုတ်ဘဲ source links, emails, contacts တွေကို
          စနစ်တကျကြည့်နိုင်အောင်ဖန်တီးထားတာပါ။
        </p>
      </section>

      <section className="mt-8 grid gap-10">
        <article className="grid gap-3 border-b border-[rgba(160,183,164,0.14)] pb-8">
          <div className="flex items-center gap-3">
            <h2 className="m-0 font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-medium leading-[1.02] tracking-[-0.03em] text-foreground">
              What the website does
            </h2>
            <span className="inline-flex items-center rounded-full border border-[rgba(160,183,164,0.18)] px-3 py-1 text-[0.72rem] uppercase tracking-[0.16em] text-[#8da693]">
              Purpose
            </span>
          </div>
          <p className="m-0 max-w-[62ch] text-sm leading-7 text-[#727975]">
            NGO, white-collar, blue-collar roles တွေကို clearer layout နဲ့
            စုစည်းပေးပြီး Thailand job market ကို အလွယ်တကူ follow လုပ်နိုင်အောင်
            ရည်ရွယ်ထားပါတယ်။
          </p>
        </article>

        <article className="grid gap-3 border-b border-[rgba(160,183,164,0.14)] pb-8">
          <div className="flex items-center gap-3">
            <h2 className="m-0 font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-medium leading-[1.02] tracking-[-0.03em] text-foreground">
              What the website does not do
            </h2>
            <span className="inline-flex items-center rounded-full border border-[rgba(160,183,164,0.18)] px-3 py-1 text-[0.72rem] uppercase tracking-[0.16em] text-[#8da693]">
              Notice
            </span>
          </div>
          <p className="m-0 max-w-[62ch] text-sm leading-7 text-[#727975]">
            Dear Career က recruitment agency မဟုတ်ပါဘူး။ Website ထဲမှာ
            application submit မလုပ်ရသေးဘဲ original source ကနေသွားလျှောက်ရမှာပါ။
          </p>
        </article>

        <article className="grid gap-3">
          <div className="flex items-center gap-3">
            <h2 className="m-0 font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-medium leading-[1.02] tracking-[-0.03em] text-foreground">
              Before you apply
            </h2>
            <span className="inline-flex items-center rounded-full border border-[rgba(160,183,164,0.18)] px-3 py-1 text-[0.72rem] uppercase tracking-[0.16em] text-[#8da693]">
              Safety
            </span>
          </div>
          <p className="m-0 max-w-[66ch] text-sm leading-7 text-[#727975]">
            CV ကလွဲလို့ အရေးကြီးစာရွက်စာတမ်းတွေမပေးပါနဲ့။ Contact channels,
            fake recruiters, scam jobs, suspicious fees တွေကို သေချာစစ်ပြီးမှ
            လျှောက်ပါ။
          </p>
        </article>
      </section>
    </main>
  );
}
