from django.http import JsonResponse

from .serializers import serialize_job
from .models import Job


def job_list(request):
    jobs = Job.objects.filter(is_active=True)
    results = [serialize_job(job) for job in jobs]
    return JsonResponse({"count": len(results), "results": results})
