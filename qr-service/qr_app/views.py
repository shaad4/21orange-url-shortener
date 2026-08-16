import io
import qrcode
import requests
from django.http import HttpResponse, JsonResponse
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def generate_qr(request, short_code):
    """
    GET /api/qr/<code>/
    Calls shortener-service to verify the short code. Generates a QR code 
    pointing to the short URL and returns it as a PNG image.
    """
    shortener_url = f"{settings.SHORTENER_SERVICE_URL}/api/urls/{short_code}/"
    try:
        response = requests.get(shortener_url, timeout=3)
        if response.status_code == 404:
            return JsonResponse({"error": "short code not found"}, status=404)
        response.raise_for_status()
    except requests.RequestException:
        return JsonResponse({"error": "failed to contact shortener service"}, status=500)

    # Build the full redirect short URL
    short_url = f"{settings.SHORTENER_SERVICE_URL}/r/{short_code}/"
    img = qrcode.make(short_url)
    
    # Save the generated QR image into an in-memory byte buffer
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return HttpResponse(buf.getvalue(), content_type="image/png")

@api_view(['GET'])
def health_check(request):
    """
    GET /health/
    Returns {"status": "ok"} to indicate this service is up .
    """
    return Response({"status": "ok"})
