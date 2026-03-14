# API Specification (OpenAPI/Swagger)

Lumina exposes a FastAPI OpenAPI schema directly from the backend service.

## Live Spec (dev)

- `http://localhost:8000/docs` — Swagger UI
- `http://localhost:8000/openapi.json` — raw OpenAPI JSON

## Reference Docs

For a curated, human-readable list of endpoints and request/response payloads, see:

- `docs/API_REFERENCE.md`

If you update routes or request models, update both the backend code and
`docs/API_REFERENCE.md` to keep the docs aligned with runtime behavior.
