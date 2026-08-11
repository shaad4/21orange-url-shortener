import os
from pathlib import Path

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from root .env file if it exists
env_file = BASE_DIR.parent / '.env'
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                try:
                    key, val = line.split('=', 1)
                    os.environ.setdefault(key.strip(), val.strip())
                except ValueError:
                    pass

# Security settings
SECRET_KEY = os.environ.get("SHORTENER_SECRET_KEY", "fallback-shortener-secret-key-12345")
DEBUG = os.environ.get("DEBUG", "True").lower() in ("true", "1", "yes")

# ALLOWED_HOSTS allows list of hostnames read from env
ALLOWED_HOSTS = [host.strip() for host in os.environ.get("ALLOWED_HOSTS", "*").split(",") if host.strip()]

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
    'urls_app',
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

ROOT_URLCONF = 'shortener_service.urls'

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

WSGI_APPLICATION = 'shortener_service.wsgi.application'

# Database
# Simple SQLite database with name loaded dynamically from env
db_path = BASE_DIR / os.environ.get("SHORTENER_DB_NAME", "db.sqlite3")
db_path.parent.mkdir(parents=True, exist_ok=True)

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': db_path,
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
# Allow requests from origins specified in env (comma-separated)
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",") if origin.strip()]

# Service URLs for Inter-service Calls
# Reading from environment variables allows configuration dynamically in Kubernetes later.
STATS_SERVICE_URL = os.environ.get("STATS_SERVICE_URL")
if not STATS_SERVICE_URL:
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured("The STATS_SERVICE_URL environment variable is required but was not found.")
