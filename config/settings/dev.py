from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*"]
DATABASES = {"default": env.db("TEST_DATABASE_URL")}
