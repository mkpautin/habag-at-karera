'use client';
import { useState, type FormEvent } from 'react';
import { api } from '@/lib/client';

export function ResetCompetition({ onReset }: { onReset: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function reset(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await api<{ message: string }>('/api/admin/reset', {
        method: 'POST',
        body: JSON.stringify({ confirmation }),
      });
      setConfirming(false);
      setConfirmation('');
      setMessage(result.message);
      await onReset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Hindi ma-reset ang laro.');
    } finally { setBusy(false); }
  }

  return <section aria-labelledby="reset-heading" className="mt-8 rounded-2xl border border-red-200 bg-white p-5 shadow">
    <h2 id="reset-heading" className="text-2xl font-black">I-reset ang laro</h2>
    <p className="mt-2 text-slate-600">Ibabalik sa simula ang lahat ng grupo at buburahin ang kanilang oras at progreso.</p>
    {confirming ? <form onSubmit={reset} className="mt-5 grid max-w-md gap-3">
      <label htmlFor="reset-confirmation" className="font-semibold">I-type ang RESET upang kumpirmahin.</label>
      <input id="reset-confirmation" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" disabled={busy} required className="rounded-xl border p-3" />
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy || confirmation !== 'RESET'} className="rounded-xl bg-red-700 px-5 py-3 font-bold text-white">{busy ? 'Nire-reset...' : 'Burahin ang progreso ng lahat'}</button>
        <button type="button" disabled={busy} onClick={() => { setConfirming(false); setConfirmation(''); setError(''); }} className="rounded-xl border px-5 py-3">Kanselahin</button>
      </div>
    </form> : <button type="button" onClick={() => { setConfirming(true); setMessage(''); }} className="mt-5 rounded-xl border border-red-700 px-5 py-3 font-bold text-red-800">I-reset ang lahat ng grupo</button>}
    {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
    {message && <p role="status" className="mt-3 text-emerald-800">{message}</p>}
  </section>;
}
