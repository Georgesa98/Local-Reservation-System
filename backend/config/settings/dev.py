from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*"]
DATABASES = {"default": env.db("TEST_DATABASE_URL")}
CORS_ALLOW_ALL_ORIGINS = True

# Override S3 storage with local filesystem for development
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
MEDIA_ROOT = BASE_DIR / "media"
MEDIA_URL = "/media/"
