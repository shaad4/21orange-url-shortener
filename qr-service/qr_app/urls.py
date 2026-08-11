from django.urls import path
from qr_app import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('api/qr/health/', views.health_check, name='health_check_api'), # custom ingress health check
    path('api/qr/<str:short_code>/', views.generate_qr, name='generate_qr'),
]
