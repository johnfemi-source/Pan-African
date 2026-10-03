import { useState, useEffect } from 'react'
import { useApi, call, auth } from './api.js'
import { Status } from './App.jsx'

const PROGRAMMES = [
  ['Leadership and mentorship', 'Train young leaders and pair them with experienced mentors.'],
  ['Entrepreneurship and employability', 'Skills, networks and opportunities to earn a living.'],
  ['Innovation and education', 'Knowledge exchange and learning across borders.'],
  ['Peacebuilding and civic engagement', 'Young people taking part in peace and public life.'],
  ['Community development and advocacy', 'Ambassadors leading projects and speaking up in their communities.'],
]
const PRINCIPLES = ['Integrity', 'Leadership', 'Unity', 'Inclusion', 'Innovation', 'Service', 'Excellence', 'Pan-Africanism']

function useForm(initial, send, done) {
  const [v, setV] = useState(initial); const [state, setState] = useState({ busy: false, error: '', ok: false })
  const set = k => e => setV({ ...v, [k]: e.target.value })
  const submit = async e => {
    e.preventDefault(); setState({ busy: true, error: '', ok: false })
    try { await send(v); setV(initial); setState({ busy: false, error: '', ok: true }); done && done() }
    catch (err) { setState({ busy: false, error: err.message, ok: false }) }
  }
  return { v, set, submit, ...state }
}
const Msg = ({ f, ok }) => (<>{f.error && <p className="err" role="alert">{f.error}</p>}{f.ok && <p className="okmsg" role="status">{ok}</p>}</>)

export function About() {
  return (<section className="page">
    <h1>About PAYAN</h1>
    <p className="prose">The Pan African Youth Ambassador Network connects, empowers and equips young people across Africa and the Diaspora to become responsible leaders, active citizens and agents of positive change. Young people are active participants in shaping Africa's future, not only beneficiaries of programmes.</p>
    <h2>Programmes</h2>
    <ul className="plain">{PROGRAMMES.map(([t, d]) => <li key={t}><strong>{t}.</strong> {d}</li>)}</ul>
    <h2>Principles</h2>
    <p className="prose">{PRINCIPLES.join(', ')}.</p>
    <h2>Partners</h2>
    <p className="prose">We work with governments, civil society, development agencies, schools, private companies and youth networks. To partner with us, <a href="/contact">send a message</a>.</p>
  </section>)
}

export function Apply() {
  const cs = useApi('/api/countries')
  const f = useForm({ fullName: '', email: '', phone: '', countrySlug: '', motivation: '' }, v => call('POST', '/api/applications', v))
  return (<section className="page"><h1>Become an ambassador</h1>
    <p className="prose">Tell us who you are and why you want to represent PAYAN. Your regional coordinator will review your application.</p>
    <Status s={cs}>{list => (
      <form onSubmit={f.submit} className="form">
        <label>Full name<input required value={f.v.fullName} onChange={f.set('fullName')} /></label>
        <label>Email<input required type="email" value={f.v.email} onChange={f.set('email')} /></label>
        <label>Phone (optional)<input value={f.v.phone} onChange={f.set('phone')} /></label>
        <label>Country<select required value={f.v.countrySlug} onChange={f.set('countrySlug')}><option value="">Choose a country</option>{list.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
        <label>Why do you want to be an ambassador?<textarea required rows="5" value={f.v.motivation} onChange={f.set('motivation')} /></label>
        <button disabled={f.busy}>{f.busy ? 'Sending…' : 'Send application'}</button>
        <Msg f={f} ok="Application sent. We will contact you by email." />
      </form>)}</Status></section>)
}

export function Contact() {
  const f = useForm({ name: '', email: '', body: '' }, v => call('POST', '/api/messages', v))
  return (<section className="page"><h1>Contact</h1>
    <p className="prose">Write to us about partnerships, programmes or anything else.</p>
    <form onSubmit={f.submit} className="form">
      <label>Name<input required value={f.v.name} onChange={f.set('name')} /></label>
      <label>Email<input required type="email" value={f.v.email} onChange={f.set('email')} /></label>
      <label>Message<textarea required rows="5" value={f.v.body} onChange={f.set('body')} /></label>
      <button disabled={f.busy}>{f.busy ? 'Sending…' : 'Send message'}</button>
      <Msg f={f} ok="Message sent. Thank you." />
    </form></section>)
}

function Login({ onDone }) {
  const f = useForm({ username: '', password: '' }, async v => { auth.set(v.username, v.password); try { await call('GET', '/api/me') } catch (e) { auth.clear(); throw e } }, onDone)
  return (<section className="page"><h1>Sign in</h1>
    <form onSubmit={f.submit} className="form">
      <label>Username<input required autoComplete="username" value={f.v.username} onChange={f.set('username')} /></label>
      <label>Password<input required type="password" autoComplete="current-password" value={f.v.password} onChange={f.set('password')} /></label>
      <button disabled={f.busy}>Sign in</button><Msg f={f} ok="" />
    </form></section>)
}

export function Dashboard() {
  const [me, setMe] = useState(null); const [checked, setChecked] = useState(false)
  const load = () => auth.get() ? call('GET', '/api/me').then(setMe).catch(() => { auth.clear(); setMe(null) }).finally(() => setChecked(true)) : setChecked(true)
  useEffect(() => { load() }, [])
  if (!checked) return <p className="page note">Loading…</p>
  if (!me) return <Login onDone={load} />
  const label = { SUPER_ADMIN: 'Super admin', REGIONAL_COORDINATOR: 'Regional coordinator', COUNTRY_REP: 'Country representative' }[me.role]
  return (<section className="page">
    <h1>Dashboard</h1>
    <p className="prose">Signed in as {me.username}, {label}. <button className="link" onClick={() => { auth.clear(); setMe(null) }}>Sign out</button></p>
    <PostForm me={me} />
    {me.role !== 'COUNTRY_REP' && <Applications />}
    {me.role === 'SUPER_ADMIN' && <><NewUser /><Inbox /></>}
  </section>)
}

function PostForm({ me }) {
  const cs = useApi('/api/countries')
  const f = useForm({ countrySlug: me.countrySlug || '', title: '', body: '', category: 'NEWS' }, v => call('POST', `/api/countries/${v.countrySlug}/posts`, v))
  return (<><h2>Post news or an event</h2><Status s={cs}>{all => {
    const mine = all.filter(c => me.role === 'SUPER_ADMIN' || (me.role === 'REGIONAL_COORDINATOR' ? c.regionSlug === me.regionSlug : c.slug === me.countrySlug))
    return (<form onSubmit={f.submit} className="form">
      <label>Country<select required value={f.v.countrySlug} onChange={f.set('countrySlug')}><option value="">Choose a country</option>{mine.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
      <label>Type<select value={f.v.category} onChange={f.set('category')}><option value="NEWS">News</option><option value="EVENT">Event</option></select></label>
      <label>Title<input required value={f.v.title} onChange={f.set('title')} /></label>
      <label>Details<textarea required rows="5" value={f.v.body} onChange={f.set('body')} /></label>
      <button disabled={f.busy}>Publish</button><Msg f={f} ok="Published. It now shows on the country page." />
    </form>)
  }}</Status></>)
}

function Applications() {
  const [list, setList] = useState(null); const [err, setErr] = useState('')
  const load = () => call('GET', '/api/admin/applications').then(setList).catch(e => setErr(e.message))
  useEffect(() => { load() }, [])
  const set = (id, status) => call('PATCH', `/api/admin/applications/${id}`, { status }).then(load).catch(e => setErr(e.message))
  return (<><h2>Ambassador applications</h2>{err && <p className="err">{err}</p>}
    {list && list.length === 0 && <p className="note">No applications yet.</p>}
    {list && list.map(a => (<article key={a.id} className="post"><h3>{a.fullName} <span className="tag">{a.status}</span></h3>
      <p className="meta">{a.countrySlug.toUpperCase()}, {a.email}{a.phone ? ', ' + a.phone : ''}</p><p>{a.motivation}</p>
      <button onClick={() => set(a.id, 'APPROVED')}>Approve</button> <button className="ghost" onClick={() => set(a.id, 'REJECTED')}>Reject</button></article>))}</>)
}

function NewUser() {
  const rs = useApi('/api/regions'); const cs = useApi('/api/countries')
  const f = useForm({ username: '', password: '', role: 'COUNTRY_REP', countrySlug: '', regionSlug: '' }, v => call('POST', '/api/admin/users', v))
  return (<><h2>Create an account</h2><form onSubmit={f.submit} className="form">
    <label>Username<input required value={f.v.username} onChange={f.set('username')} /></label>
    <label>Password (8 or more characters)<input required minLength="8" type="password" value={f.v.password} onChange={f.set('password')} /></label>
    <label>Role<select value={f.v.role} onChange={f.set('role')}><option value="COUNTRY_REP">Country representative</option><option value="REGIONAL_COORDINATOR">Regional coordinator</option><option value="SUPER_ADMIN">Super admin</option></select></label>
    {f.v.role === 'COUNTRY_REP' && <label>Country<select required value={f.v.countrySlug} onChange={f.set('countrySlug')}><option value="">Choose</option>{(cs.data || []).map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>}
    {f.v.role === 'REGIONAL_COORDINATOR' && <label>Region<select required value={f.v.regionSlug} onChange={f.set('regionSlug')}><option value="">Choose</option>{(rs.data || []).map(r => <option key={r.slug} value={r.slug}>{r.name}</option>)}</select></label>}
    <button disabled={f.busy}>Create account</button><Msg f={f} ok="Account created." />
  </form></>)
}

function Inbox() {
  const [list, setList] = useState(null)
  useEffect(() => { call('GET', '/api/admin/messages').then(setList).catch(() => setList([])) }, [])
  return (<><h2>Messages</h2>{list && list.length === 0 && <p className="note">No messages yet.</p>}
    {(list || []).map(m => <article key={m.id} className="post"><h3>{m.name}</h3><p className="meta"><a href={`mailto:${m.email}`}>{m.email}</a>, {new Date(m.createdAt).toLocaleDateString()}</p><p>{m.body}</p></article>)}</>)
}
