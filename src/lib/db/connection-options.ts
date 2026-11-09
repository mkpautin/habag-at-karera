import { X509Certificate } from 'node:crypto';
import type { PoolConfig } from 'pg';
import { z } from 'zod';

// Shared by server database access and operational scripts; never import into client code.
export function databaseConnectionOptions(connectionString: string, certificate = process.env.DATABASE_SSL_CA): PoolConfig {
  const url = z.url().parse(connectionString);
  if (!certificate?.trim()) return { connectionString: url };

  const ca = certificate.replace(/\\n/g, '\n').trim();
  try {
    new X509Certificate(ca);
  } catch {
    throw new Error('DATABASE_SSL_CA must contain a valid PEM root certificate.');
  }

  // pg replaces the explicit SSL object when these options appear in the URL.
  const parsed = new URL(url);
  for (const option of ['ssl', 'sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'sslnegotiation', 'uselibpqcompat']) {
    parsed.searchParams.delete(option);
  }
  return { connectionString: parsed.toString(), ssl: { ca, rejectUnauthorized: true } };
}
