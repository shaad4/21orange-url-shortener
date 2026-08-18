import logging
import requests
from django.shortcuts import get_object_or_404
from django.http import HttpResponseRedirect
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from urls_app.models import Url
from urls_app.serializers import UrlSerializer

logger = logging.getLogger(__name__)

@api_view(['POST'])
def shorten_url(request):
    """
    POST /api/shorten/
    Body: {"long_url": "https://..."}
    Creates a new Url entry and returns its short code and short redirection URL.
    """
    serializer = UrlSerializer(data=request.data)
    if serializer.is_valid():
        try:
            url_obj = serializer.save()
            # Construct short_url dynamically using the request's absolute URI
            short_url = request.build_absolute_uri(f"/r/{url_obj.short_code}/")
            return Response({
                "short_code": url_obj.short_code,
                "long_url": url_obj.long_url,
                "short_url": short_url
            }, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def url_detail(request, short_code):
    """
    GET /api/urls/<code>/
    Returns info mapping a short code back to its long URL. Returns 404 if not found.
    """
    url_obj = get_object_or_404(Url, short_code=short_code)
    return Response({
        "short_code": url_obj.short_code,
        "long_url": url_obj.long_url
    })

@api_view(['GET'])
def redirect_url(request, short_code):
    """
    GET /r/<code>/ or GET /r/<code>
    Looks up the long URL in SQLite, notifies stats-service via REST,
    then redirects the client via HTTP 302.
    """
    url_obj = get_object_or_404(Url, short_code=short_code)
    
    # Notify stats-service of click event
    # Using dynamic url from settings.py with default fallback
    stats_url = f"{settings.STATS_SERVICE_URL}/api/clicks/"
    try:
        # Wrap cross-service call in try/except with a 3-second timeout.
        # If stats-service is down, the redirect must still work!
        requests.post(stats_url, json={"short_code": short_code}, timeout=3)
    except requests.RequestException as e:
        # Log failure locally but allow the flow to continue.
        logger.warning(f"Stats-service click logging failed: {e}")

    # Perform redirect
    return HttpResponseRedirect(url_obj.long_url)

@api_view(['GET'])
def health_check(request):
    """
    GET /health/
    Returns {"status": "ok"} to indicate this service is up.
    """
    return Response({"status": "ok"})
