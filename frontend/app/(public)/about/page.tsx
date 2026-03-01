export default function PublicAboutPage() {
  return (
    <main className="page-shell public-about-page">
      <section className="public-about-hero stack">
        <div className="eyebrow">About Dear Career</div>
        <h1 className="section-title">A cleaner way to discover jobs in Thailand</h1>
        <p className="public-about-copy">
          Dear Career က Thailand jobs opportunities တွေကို တစ်နေရာထဲမှာ
          စုစည်းပေးထားတဲ့ curated website တစ်ခုပါ။ Website ထဲကနေတိုက်ရိုက်
          လျှောက်ရတာမဟုတ်ဘဲ source links, emails, contacts တွေကို
          စနစ်တကျကြည့်နိုင်အောင်ဖန်တီးထားတာပါ။
        </p>
      </section>

      <section className="public-about-grid">
        <article className="public-about-card stack">
          <div className="eyebrow">Purpose</div>
          <h2 className="public-about-title">What the website does</h2>
          <p className="public-footer-copy">
            NGO, white-collar, blue-collar roles တွေကို clearer layout နဲ့
            စုစည်းပေးပြီး Thailand job market ကို အလွယ်တကူ follow လုပ်နိုင်အောင်
            ရည်ရွယ်ထားပါတယ်။
          </p>
        </article>

        <article className="public-about-card stack">
          <div className="eyebrow">Notice</div>
          <h2 className="public-about-title">What the website does not do</h2>
          <p className="public-footer-copy">
            Dear Career က recruitment agency မဟုတ်ပါဘူး။ Website ထဲမှာ
            application submit မလုပ်ရသေးဘဲ original source ကနေသွားလျှောက်ရမှာပါ။
          </p>
        </article>

        <article className="public-about-card stack public-about-card-wide">
          <div className="eyebrow">Safety</div>
          <h2 className="public-about-title">Before you apply</h2>
          <p className="public-footer-copy">
            CV ကလွဲလို့ အရေးကြီးစာရွက်စာတမ်းတွေမပေးပါနဲ့။ Contact channels,
            fake recruiters, scam jobs, suspicious fees တွေကို သေချာစစ်ပြီးမှ
            လျှောက်ပါ။
          </p>
        </article>
      </section>
    </main>
  );
}
