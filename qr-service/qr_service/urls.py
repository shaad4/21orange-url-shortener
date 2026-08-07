from django.urls import path, include

urlpatterns = [
    path('', include('qr_app.urls')),
]
