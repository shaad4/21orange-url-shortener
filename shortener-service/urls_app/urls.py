from django.urls import path
from urls_app import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('api/shorten/', views.shorten_url, name='shorten_url'),
    path('api/urls/<str:short_code>/', views.url_detail, name='url_detail'),
    # Support both with and without trailing slash for the redirect endpoint
    path('r/<str:short_code>/', views.redirect_url, name='redirect_url'),
    path('r/<str:short_code>', views.redirect_url, name='redirect_url_no_slash'),
]
