import { useEffect, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { api } from '../bridge';
import type { Game } from '../types';
import { gameNames } from '../catalog/catalogs';
export function Feedback({ game, version }: { game: Game; version?: string }) {
  const [open, setOpen] = useState(false), [configured, setConfigured] = useState(false);
  const [kind, setKind] = useState('Bug report'), [subject, setSubject] = useState(''), [message, setMessage] = useState(''), [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState(false);
  useEffect(() => { api.feedbackStatus().then(s => setConfigured(s.configured)).catch(() => {}); }, []);
  function show() { setError(''); setSuccess(false); setOpen(true); }
  return <section className="panel content-panel"><h2><MessageSquare size={22}/>Reports & suggestions</h2><p>Found something wrong or have an idea? Send it to bancywaypoint@gmail.com.</p><button className="button outline" onClick={show}><MessageSquare size={17}/>Report a bug or suggest an idea</button>{!configured && <p className="muted small">Delivery setup is pending. You can prepare a draft; sending becomes available when the app’s delivery endpoint is configured.</p>}{open && <Dialog title="Report a bug or suggest an idea" onClose={() => { if (!busy) setOpen(false); }}><form className="feedback-form" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(''); try { await api.sendFeedback({kind,subject,message,email,game:gameNames[game]}); setSuccess(true); setSubject('');setMessage(''); } catch(e) { setError(e instanceof Error?e.message:'Report could not be sent. Your draft has been kept.'); } finally {setBusy(false);} }}>
    {success ? <><p role="status">The delivery service accepted your report for bancywaypoint@gmail.com. Thank you.</p><button type="button" className="button primary" onClick={()=>setOpen(false)}>Close</button></> : <>
    <label>Type<select value={kind} disabled={busy} onChange={e=>setKind(e.target.value)}><option>Bug report</option><option>Suggestion</option></select></label>
    <label>Subject<input required minLength={3} maxLength={120} value={subject} disabled={busy} onChange={e=>setSubject(e.target.value)} placeholder="What should we look at?"/></label>
    <label>Details<textarea required minLength={10} maxLength={6000} rows={6} value={message} disabled={busy} onChange={e=>setMessage(e.target.value)} placeholder={kind==='Bug report'?'What happened? What did you expect? How can we reproduce it?':'Describe your idea and how it would help.'}/></label>
    <label>Reply email (optional)<input type="email" maxLength={254} value={email} disabled={busy} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
    <p className="muted small">Includes BancyCraft {version || __APP_VERSION__} and {gameNames[game]}. No workspace, account tokens or access keys are attached. Only include information you want to send.</p>
    {!configured && <p className="notice">Sending is unavailable until delivery is configured. Your draft stays here while the app is open.</p>}
    {error && <p role="alert" className="notice">{error}</p>}
    <div className="actions"><button className="button primary" disabled={busy||!configured}><Send size={16}/>{busy?'Sending…':'Send report'}</button><button type="button" className="button outline" disabled={busy} onClick={()=>setOpen(false)}>Close</button></div></>}
  </form></Dialog>}</section>;
}
