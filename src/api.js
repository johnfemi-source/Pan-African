import { useEffect, useState } from 'react'
const API = '/api/v1'
const toApiUrl = url => {
  const clean = url.startsWith('/api') ? url.replace(/^\/api/, '') : url
  return `${API}${clean.startsWith('/') ? clean : '/' + clean}`
}
export const auth = {
  get: () => sessionStorage.getItem('auth'),
  set: (u, p) => sessionStorage.setItem('auth', 'Basic ' + btoa(u + ':' + p)),
  clear: () => sessionStorage.removeItem('auth'),
}
export async function call(method, url, body) {
  const r = await fetch(toApiUrl(url), {
    method, body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', ...(auth.get() ? { Authorization: auth.get() } : {}) },
  })
  if (!r.ok) {
    let m = 'Something went wrong. Try again.'
    try { m = (await r.json()).message || m } catch {}
    throw new Error(r.status === 401 ? 'Wrong username or password.' : r.status === 403 ? 'You do not have permission to do this.' : m)
  }
  return r.status === 204 ? null : r.json().catch(() => null)
}
export function useApi(url) {
  const [s, set] = useState({ data: null, error: null })
  useEffect(() => {
    let live = true
    set({ data: null, error: null })
    call('GET', url).then(data => live && set({ data, error: null })).catch(e => live && set({ data: null, error: e.message }))
    return () => { live = false }
  }, [url])
  return s
}
export const flag = iso => `https://flagcdn.com/w80/${iso}.png`
