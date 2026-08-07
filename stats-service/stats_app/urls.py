from django.urls import path
from stats_app import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('api/clicks/', views.record_click, name='record_click'),
    path('api/stats/<str:short_code>/', views.get_stats, name='get_stats'),
]
