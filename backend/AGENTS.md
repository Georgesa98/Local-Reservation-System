# AGENTS.md

## Scope
This file applies to `backend/` and all subdirectories unless a deeper `AGENTS.md` overrides it.

## Backend Stack
- Django 5.2
- Django REST Framework 3.16
- PostgreSQL
- Redis + Celery
- pytest + pytest-django

## Implementation Rules
- Keep API responses consistent with existing response envelope conventions.
- Enforce auth and permissions explicitly for each endpoint.
- Use serializers and validators for request validation, not ad hoc checks in views.
- Create migrations for all model and schema changes; do not edit old migrations.
- Keep business logic in reusable service or domain layers when possible.
- Preserve idempotency and auditability for payment and booking lifecycle actions.

## Testing and Verification
- Add or update pytest coverage for any behavior change.
- Minimum verification for backend changes:
  - `pytest`
  - `python manage.py check`
