# Shared library guidance

This scope covers reusable domain logic, schemas, and utilities under `src/lib/`.

- Separate browser-safe modules from server-only modules. Mark server-only entry points with the project's established guard (for example, `server-only`) where available.
- Put Zod schemas close to the domain or boundary they validate. Infer TypeScript types from schemas when that avoids drift.
- Keep environment parsing centralized and fail early with clear variable names; never expose server secrets to client bundles.
- Keep helpers small, deterministic where practical, and explicit about side effects. Avoid importing route UI into shared logic.
- Use domain-oriented names and return typed results. Do not hide errors that callers need to handle.
