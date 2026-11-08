# Script guidance

This scope covers repository scripts for development, migration, seeding, and maintenance.

- Make scripts safe to rerun when practical and require an explicit target before destructive actions.
- Parse and validate arguments and environment variables; provide a concise usage message for invalid input.
- Keep secrets out of output and ensure database scripts use the same validated configuration and Drizzle setup as the application where appropriate.
- Avoid embedding environment-specific hostnames, credentials, or production assumptions.
- Document new operational scripts and their expected environment in `docs/operations.md` or the README.
