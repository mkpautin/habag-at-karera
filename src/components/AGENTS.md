# UI component guidance

This scope covers shared React components and their Tailwind CSS styling.

- Build components around clear responsibilities and accessible HTML semantics. Provide labels, keyboard operation, focus states, and appropriate ARIA only where needed.
- Keep components server-renderable by default. Add `'use client'` only for interactive behavior and keep that boundary close to the interaction.
- Use the project's existing class utilities, variants, and design tokens if present. Do not introduce a second styling system or arbitrary one-off values without a reason.
- Keep conditional class logic readable; extract a small helper or variant definition when it makes intent clearer.
- Do not put database calls, secrets, or authorization decisions in presentation components.
- Reuse existing components before adding near-duplicates. Keep component props explicit and typed.
