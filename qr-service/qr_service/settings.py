import os
from pathlib import Path

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Security settings
SECRET_KEY = 'django-insecure-q9u8i7y6-f)20(b%*h3_&^u-p*y6^z2+&x5z0s7f8f=6@+*3'
DEBUG = True

# ALLOWED_HOSTS allows all hostnames during local learning / dev (not for production)
ALLOWED_HOSTS = ["*"]

# Application definition
INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # External libraries
    'rest_framework',
    'corsheaders',
    # Our app
    'qr_app',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Places CORS headers at the very top of processing
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'qr_service.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'qr_service.wsgi.application'

# Database
# Using SQLite. While qr-service is stateless and has no models, 
# Django expects a default database configuration to boot correctly.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS Settings
# Allow request from the React frontend running on port 3000
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]

# Service URLs for Inter-service Calls
# Reads from environment variable with a sane localhost default.
# This makes it easy to switch to Kubernetes service names later without changing code.
SHORTENER_SERVICE_URL = os.environ.get("SHORTENER_SERVICE_URL", "http://localhost:8001")
