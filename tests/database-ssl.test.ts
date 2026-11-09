import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rootCertificates } from 'node:tls';
import { Client } from 'pg';
import { databaseConnectionOptions } from '../src/lib/db/connection-options';

test('explicit database CA survives pg URL parsing and enforces certificate verification', () => {
  const ca = rootCertificates[0];
  for (const mode of ['require', 'verify-full', 'no-verify', 'disable']) {
    const options = databaseConnectionOptions(`postgres://user:password@pooler.example:6543/postgres?sslmode=${mode}&sslrootcert=/missing/local/file&ssl=true&application_name=game`, ca.replace(/\n/g, '\\n'));
    const client = new Client(options);
    assert.deepEqual(client.ssl, { ca: ca.trim(), rejectUnauthorized: true });
    const url = new URL(options.connectionString!);
    assert.equal(url.hostname, 'pooler.example');
    assert.equal(url.searchParams.get('application_name'), 'game');
    assert.equal(url.searchParams.has('sslmode'), false);
  }
});

test('database connections preserve existing settings without a CA and reject malformed certificates', () => {
  const url = 'postgres://user:password@localhost:5432/test?sslmode=disable';
  assert.deepEqual(databaseConnectionOptions(url, ''), { connectionString: url });
  assert.throws(() => databaseConnectionOptions(url, 'invalid certificate'), { message: 'DATABASE_SSL_CA must contain a valid PEM root certificate.' });
});
