import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useApi, flag, call, auth } from './api.js'
import { Apply, Contact, About, Dashboard } from './pages.jsx'
import logoUrl from '../logo.png'

const CONTACT = { email: 'panafricanyouthambassadorsnetw@gmail.com' }

function Status({ s, children }) {
  if (s.error) return <p className="note">Could not load this page: {s.error}. Refresh to try again.</p>
  if (!s.data) return <p className="note">Loading…</p>
  return children(s.data)
}

function Layout({ children }) {
  return (<>
    <header className="bar">
      <Link to="/" className="brand"><img src={logoUrl} alt="" className="logo-img" /><span>PAYAN</span></Link>
      <nav aria-label="Main navigation">
        <NavLink to="/about">About</NavLink>
        <NavLink to="/apply">Apply</NavLink>
        <NavLink to="/contact">Contact</NavLink>
        <NavLink to="/dashboard" className="nav-login">Sign in</NavLink>
      </nav>
    </header>
    <main>{children}</main>
    <footer className="foot">Pan African Youth Ambassador Network · Africa and the Diaspora</footer>
  </>)
}

function Home() {
  const s = useApi('/api/regions')
  return (<>
    <section className="hero">
      <div className="hero-row">
        <div className="hero-copy">
          <p className="eyebrow">Pan-African Youth Ambassador Network</p>
          <h1>Young Africans, one network, every country.</h1>
          <p className="lede">Across borders and generations, young people are building a more connected Africa.</p>
          <a className="hero-link" href="#regions">Explore the network <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-art"><img src={logoUrl} alt="Pan-African Youth Ambassadors Network logo" className="hero-mark" /></div>
      </div>
    </section>
    <section id="regions" className="region-section">
      <div className="section-heading"><div><p className="eyebrow">Across Africa and the diaspora</p><h2>Explore by region</h2></div><p>Meet the ambassadors and discover the work happening in each country.</p></div>
      <Status s={s}>{regions => <ul className="regions">{regions.map((region, index) => (
        <li key={region.slug}><Link to={`/regions/${region.slug}`}><span className="region-index">{String(index + 1).padStart(2, '0')}</span><span className="rname">{region.name}</span><span className="region-arrow" aria-hidden="true">↗</span></Link></li>
      ))}</ul>}</Status>
    </section>
    <section id="about" className="split">
      <div><h2>Vision</h2><p>A connected generation of young Africans working across borders to build a peaceful, inclusive, innovative and prosperous Africa.</p></div>
      <div><h2>Mission</h2><p>To connect, empower and equip young people across Africa and the Diaspora to become responsible leaders and agents of positive change.</p></div>
    </section>
    <section className="split">
      <div><h2>Finance summary</h2><p className="note">This section is reserved. It will show a public summary once PAYAN confirms what to publish.</p></div>
      <div><h2>Past members and events</h2><p className="note">Group photos will appear here once the gallery is built.</p></div>
    </section>
    <section id="contact" className="split">
      <div><h2>Contact</h2><p><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></p></div>
    </section>
  </>)
}

function Region() {
  const slug = location.pathname.split('/').pop()
  const s = useApi(`/api/regions/${slug}`)
  return (<section className="page">
    <Link to="/" className="back">All regions</Link>
    <Status s={s}>{r => (<>
      <h1>{r.name}</h1>
      <ul className="countries">{r.countries.map(c => (
        <li key={c.slug}><Link to={`/countries/${c.slug}`}><img src={flag(c.iso)} alt="" width="40" height="27" />{c.name}</Link></li>))}</ul>
    </>)}</Status>
  </section>)
}

function Country() {
  const slug = location.pathname.split('/').pop()
  const s = useApi(`/api/countries/${slug}`)
  return (<section className="page">
    <Status s={s}>{v => (<>
      <Link to={`/regions/${v.regionSlug}`} className="back">{v.regionName}</Link>
      <h1 className="chead"><img src={flag(v.country.iso)} alt="" width="64" height="43" />{v.country.name}</h1>
      {v.posts.length === 0
        ? <p className="note">No updates from {v.country.name} yet. Country representatives can post news and events here.</p>
        : v.posts.map(p => (<article key={p.id} className="post">
            <h3>{p.title}</h3>
            <p className="meta">{p.category === 'EVENT' ? 'Event' : 'News'}, {new Date(p.createdAt).toLocaleDateString()}, by {p.author}</p>
            <p>{p.body}</p></article>))}
    </>)}</Status>
  </section>)
}

export { Status }
export default function App() {
  return (<Layout><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/regions/:slug" element={<Region />} />
    <Route path="/countries/:slug" element={<Country />} />
    <Route path="/about" element={<About />} />
    <Route path="/apply" element={<Apply />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="*" element={<p className="page note">Page not found.</p>} />
  </Routes></Layout>)
}
