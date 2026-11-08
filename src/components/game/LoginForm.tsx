'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, TOKEN_KEY } from '@/lib/client';

export function LoginForm() {
  const router = useRouter(); const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { const result = await api<{ token: string; role: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }); sessionStorage.setItem(TOKEN_KEY, result.token); router.replace(result.role === 'ADMIN' ? '/admin' : '/play'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Hindi makapag-log in.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen grid place-items-center p-5"><div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-emerald-100"><p className="text-sm font-bold uppercase tracking-[.25em] text-amber-700">Maligayang pagdating</p><h1 className="text-4xl font-black mt-3">Habag at Karera</h1><p className="text-slate-600 mt-3">Mag-log in upang ipagpatuloy ang karera ng inyong grupo.</p><form onSubmit={submit} className="mt-8 grid gap-4"><label className="grid gap-2 font-semibold">Grupo o admin<input required autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} className="rounded-xl border p-3 font-normal" /></label><label className="grid gap-2 font-semibold">Password<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="rounded-xl border p-3 font-normal" /></label>{error && <p role="alert" className="text-red-700">{error}</p>}<button disabled={busy} className="rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white">{busy ? 'Sandali...' : 'Mag-log in'}</button></form></div></main>;
}
