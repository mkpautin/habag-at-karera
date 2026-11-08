# App Router guidance

This scope covers layouts, pages, loading/error/not-found UI, route handlers, and server actions under `src/app/`.

- Keep route files focused on routing, composition, and framework conventions. Put reusable UI in `src/components/` and reusable domain logic in `src/lib/`.
- Prefer Server Components. A Client Component boundary should be as small as practical; never import server-only database modules into client code.
- Use route groups and nested layouts to express shared navigation or authorization boundaries without changing URLs.
- Handle loading, empty, success, and error states intentionally. Avoid exposing stack traces, SQL errors, tokens, or private records.
- Validate route params, search params, form data, and JSON payloads with Zod before using them. Enforce authorization on the server for every protected operation.
- For mutations, use the repository's established server action or route-handler pattern. Revalidate or redirect only after successful changes.
- Keep metadata accurate and avoid fetching the same data redundantly across a route tree when framework caching or composition can handle it safely.
