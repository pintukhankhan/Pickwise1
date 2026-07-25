(updated) Required environment variables

This patch introduces server-side session authentication. Add the following to your .env in production:

- SESSION_SECRET: a long, random string used to sign session cookies (required for production)
- ADMIN_PASSWORD_HASH: bcrypt hash of the admin password (preferred)
- ADMIN_PASSWORD: plain admin password (supported for development only; prefer ADMIN_PASSWORD_HASH)

Notes
- The server will set an HttpOnly session cookie for browser access and still returns a Bearer token for backward compatibility.
- In production, use a persistent session store (Redis) instead of the default in-memory store.
- Keep GITHUB_TOKEN and PA-API keys as before; do NOT commit secrets.

