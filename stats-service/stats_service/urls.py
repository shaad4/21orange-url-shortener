from django.urls import path, include

urlpatterns = [
    path('', include('stats_app.urls')),
]
