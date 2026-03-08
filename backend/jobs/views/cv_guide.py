from django.core.exceptions import ValidationError
from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from ..admin_api import require_admin_api_auth
from ..models import CvGuideContent
from ..serializers import serialize_cv_guide_content
from ..validation import clean_text_input, format_validation_error, validate_instance
from .shared import load_json_body

DEFAULT_GUIDE_TEXT = """✅ Summary ကို 3 ကြောင်းထက်မပိုရေးပါ
နာမည်နဲ့ Contact အချက်အလက်တွေအောက်မှာ Summary ကို 3 ကြောင်းထက် ပိုမရေးပါနဲ့။
"I am a hardworking professional seeking a challenging role..." လို generic sentence မသုံးပါနဲ့။
အဲ့လိုရေးမယ့်အစား ကိုယ်က ဘယ်လိုပြဿနာတွေကို ဖြေရှင်းပေးနိုင်သလဲဆိုတာကို ဦးစားပေးပါ။
ဥပမာ:
"Software Engineer with 8+ years of experience in building scalable systems. Expert in optimizing performance and ensuring security compliance for high-traffic platforms."

✅ Skills ကို အုပ်စုခွဲရေးပါ
Skill တွေကို စာကြောင်းရှည်ကြီးနဲ့ မရေးပါနဲ့။ ATS ကိုက်အောင် Job Description ထဲက keyword တွေကို ပြန်သုံးပါ။
ဥပမာ:
Languages: JavaScript (ES6+), TypeScript, HTML5, CSS3/SCSS
Frontend: React.js, Next.js, Vue/Angular
Logic & Data: RESTful APIs Integration, JSON, Redux, Zustand, Context API
UI Libraries: Tailwind CSS, Material UI, Bootstrap

✅ Experience မှာ result ကိုရေးပါ
နောက်ဆုံးလုပ်ခဲ့တဲ့ အလုပ်ကို အပေါ်ဆုံးထားပါ (reverse chronological)။
Soft skill ကို သီးသန့်မရေးဘဲ Experience bullet ထဲမှာ ပြပါ။
ဥပမာ: Collaborated with UI/UX designers and backend team to launch key features.

✅ ရိုးရှင်းတဲ့ layout သုံးပါ
Single-column layout ကိုသုံးပါ။ ATS တွေက table, two-column layout တွေကို ဖတ်ရခက်တတ်ပါတယ်။
Font: Arial, Calibri, Helvetica (10-12pt)
Section title: Experience, Skills, Education
Action verbs သုံးပါ: Managed, Developed, Increased
Bullet points သုံးပါ။ Paragraph အရှည်ကြီး မရေးပါနဲ့။

✅ "ဘာလုပ်ခဲ့လဲ" ထက် "ဘာအောင်မြင်ခဲ့လဲ" ကိုရေးပါ
"I used Zustand for state management" လို့မရေးဘဲ
"Integrated Zustand for state management, reducing boilerplate code by 30% and optimizing application performance." လို metrics ပါအောင်ရေးပါ။

✅ ဘာတွေရှောင်ရမလဲ
ဓာတ်ပုံ၊ icons၊ graph တွေ အရမ်းမသုံးပါနဲ့။
Progress bar style (Skill 80%) မသုံးပါနဲ့။

✅ Role အလိုက် CV ခွဲပြင်ပါ
CV တစ်စောင်တည်းနဲ့ အကုန်မလျှောက်ပါနဲ့။ JD အလိုက် summary, skills, achievements ကိုပြင်ပါ။
Master CV တစ်စောင်ထားပြီး apply မလုပ်ခင် relevant content ကိုရွေးထုတ်ပါ။
Filename example: name_position.pdf or name_position_company.pdf

✅ Tools (optional)
Rezi, Teal, FlowCV, Wobo တို့ကို keyword/ATS check အတွက်သုံးလို့ရပါတယ်။ Free plan limitations ရှိနိုင်ပါတယ်။"""


def get_cv_guide() -> CvGuideContent:
    guide, _ = CvGuideContent.objects.get_or_create(
        key="default",
        defaults={
            "title": "CV Guide: Design Better, Write Clearer",
            "intro": "Use this guide to build a clean CV that recruiters can scan quickly and trust.",
            "guide_text": DEFAULT_GUIDE_TEXT,
        },
    )
    if not clean_text_input(guide.guide_text):
        guide.guide_text = DEFAULT_GUIDE_TEXT
        guide.save(update_fields=["guide_text", "updated_at"])
    return guide


@require_GET
def public_cv_guide_content(request: HttpRequest):
    guide = get_cv_guide()
    return JsonResponse(serialize_cv_guide_content(guide))


@csrf_exempt
@require_admin_api_auth
@require_http_methods(["GET", "PATCH"])
def admin_cv_guide_content(request: HttpRequest):
    guide = get_cv_guide()

    if request.method == "GET":
        return JsonResponse(serialize_cv_guide_content(guide))

    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    if "title" in payload:
        guide.title = clean_text_input(payload.get("title"))
    if "intro" in payload:
        guide.intro = clean_text_input(payload.get("intro"))
    if "guide_text" in payload:
        guide.guide_text = clean_text_input(payload.get("guide_text"))

    if not guide.title:
        return HttpResponseBadRequest("Title is required.")
    if not guide.intro:
        return HttpResponseBadRequest("Intro is required.")
    if not guide.guide_text:
        return HttpResponseBadRequest("Guide text is required.")

    try:
        validate_instance(guide)
    except ValidationError as exc:
        return HttpResponseBadRequest(format_validation_error(exc, "Invalid CV guide payload."))

    guide.save()
    return JsonResponse(serialize_cv_guide_content(guide))
