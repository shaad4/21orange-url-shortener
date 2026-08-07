from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from stats_app.models import Click

@api_view(['POST'])
def record_click(request):
    """
    POST /api/clicks/
    Body: {"short_code": "abc123"}
    Logs a click event for the given short_code. Returns 201 Created.
    """
    short_code = request.data.get('short_code')
    if not short_code:
        return Response({"error": "short_code is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create and save a new Click entry
    Click.objects.create(short_code=short_code)
    
    return Response({
        "status": "success",
        "message": f"Click logged for short code: {short_code}"
    }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def get_stats(request, short_code):
    """
    GET /api/stats/<code>/
    Returns the total click count and the last clicked timestamp for a short code.
    """
    clicks = Click.objects.filter(short_code=short_code)
    click_count = clicks.count()
    
    # Retrieve the most recent click event
    last_click = clicks.order_by('-clicked_at').first()
    last_clicked_timestamp = last_click.clicked_at.isoformat() if last_click else None
    
    return Response({
        "short_code": short_code,
        "click_count": click_count,
        "last_clicked": last_clicked_timestamp
    })

@api_view(['GET'])
def health_check(request):
    """
    GET /health/
    Returns {"status": "ok"} to indicate this service is up.
    """
    return Response({"status": "ok"})
