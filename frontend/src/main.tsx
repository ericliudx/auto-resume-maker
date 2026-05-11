import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

function renderCrash(err: unknown) {
  const root = document.getElementById('root')
  if (!root) return
  const msg = err instanceof Error ? `${err.name}: ${err.message}\n\n${err.stack ?? ''}` : String(err)
  root.innerHTML = `<pre style="white-space:pre-wrap;padding:16px;font-family:ui-monospace,Consolas,monospace;color:#111;background:#fff;min-height:100svh;box-sizing:border-box;">App crashed:\n\n${msg.replaceAll(
    '&',
    '&amp;',
  ).replaceAll('<', '&lt;')}</pre>`
}

window.addEventListener('error', (e) => {
  renderCrash(e.error ?? e.message)
})
window.addEventListener('unhandledrejection', (e) => {
  renderCrash((e as PromiseRejectionEvent).reason)
})

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (e) {
  renderCrash(e)
}
