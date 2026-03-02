export default function PublicAboutPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-28 md:pt-32">
      <section className="grid gap-3 rounded-[2rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.74)] p-4 shadow-soft backdrop-blur-xl lg:p-5">
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">About Dear Career</div>
        <h1 className="font-serif text-[clamp(2.2rem,4vw,4.2rem)] font-medium leading-[0.96] tracking-[-0.04em] text-foreground">
          A cleaner way to discover jobs in Thailand
        </h1>
        <p className="mb-0 max-w-[66ch] text-sm leading-6 text-[#727975]">
          Dear Career က Thailand jobs opportunities တွေကို တစ်နေရာထဲမှာ
          စုစည်းပေးထားတဲ့ curated website တစ်ခုပါ။ Website ထဲကနေတိုက်ရိုက်
          လျှောက်ရတာမဟုတ်ဘဲ source links, emails, contacts တွေကို
          စနစ်တကျကြည့်နိုင်အောင်ဖန်တီးထားတာပါ။
        </p>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2">
        <article>
          <div className="grid h-full gap-2 rounded-[2rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.74)] p-4 shadow-soft backdrop-blur-xl">
            <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Purpose</div>
            <h2 className="font-serif text-[clamp(1.6rem,3vw,2.4rem)] font-medium leading-[1.02] tracking-[-0.03em] text-foreground">
              What the website does
            </h2>
            <p className="mb-0 text-sm leading-6 text-[#727975]">
              NGO, white-collar, blue-collar roles တွေကို clearer layout နဲ့
              စုစည်းပေးပြီး Thailand job market ကို အလွယ်တကူ follow လုပ်နိုင်အောင်
              ရည်ရွယ်ထားပါတယ်။
            </p>
          </div>
        </article>

        <article>
          <div className="grid h-full gap-2 rounded-[2rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.74)] p-4 shadow-soft backdrop-blur-xl">
            <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Notice</div>
            <h2 className="font-serif text-[clamp(1.6rem,3vw,2.4rem)] font-medium leading-[1.02] tracking-[-0.03em] text-foreground">
              What the website does not do
            </h2>
            <p className="mb-0 text-sm leading-6 text-[#727975]">
              Dear Career က recruitment agency မဟုတ်ပါဘူး။ Website ထဲမှာ
              application submit မလုပ်ရသေးဘဲ original source ကနေသွားလျှောက်ရမှာပါ။
            </p>
          </div>
        </article>

        <article className="md:col-span-2">
          <div className="grid gap-2 rounded-[2rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.74)] p-4 shadow-soft backdrop-blur-xl">
            <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Safety</div>
            <h2 className="font-serif text-[clamp(1.6rem,3vw,2.4rem)] font-medium leading-[1.02] tracking-[-0.03em] text-foreground">
              Before you apply
            </h2>
            <p className="mb-0 max-w-[66ch] text-sm leading-6 text-[#727975]">
              CV ကလွဲလို့ အရေးကြီးစာရွက်စာတမ်းတွေမပေးပါနဲ့။ Contact channels,
              fake recruiters, scam jobs, suspicious fees တွေကို သေချာစစ်ပြီးမှ
              လျှောက်ပါ။
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
