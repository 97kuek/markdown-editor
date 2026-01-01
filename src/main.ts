import { EditorView } from "codemirror"
import './style.css'
import 'github-markdown-css/github-markdown-dark.css'
import 'katex/dist/katex.min.css'
import 'markdown-it-texmath/css/texmath.css'
import './katex-fix.css' // Keep for now, might check if needed
import './resizer.css'
import './responsive.css'


import { createEditor } from './editor'
import { renderMarkdown } from './preview'
import { setupScrollSync } from './scroll-sync'
import { enableResizer } from './resizer'
import { setupFileSystem } from './fs-access'
import { setupTOC } from './toc'

const STORAGE_KEY = 'mde-content'
const initialContent = localStorage.getItem(STORAGE_KEY) || `# Welcome to Markdown Editor

This is a lightweight, real-time preview editor.

## Features
- **Real-time Preview**
- **Math Support**: $E = mc^2$
- **Scroll Sync**
- **Export to PDF/MD**

## Try Math

$$
\\frac{1}{\\Bigl(\\sqrt{\\phi \\sqrt{5}}-\\phi\\Bigr) e^{\\frac25 \\pi}} = 1+\\frac{e^{-2\\pi}} {1+\\frac{e^{-4\\pi}} {1+\\frac{e^{-6\\pi}} {1+\\frac{e^{-8\\pi}} {1+\\dots} } } }
$$

## Code

\`\`\`typescript
console.log("Hello World");
\`\`\`
`

const editorPane = document.getElementById('editor-pane') as HTMLElement
const previewPane = document.getElementById('preview-pane') as HTMLElement
const resizerElement = document.getElementById('resizer') as HTMLElement
const container = document.getElementById('workspace') as HTMLElement

enableResizer(resizerElement, editorPane, container)

// Mobile View Toggle
const btnToggleView = document.getElementById('btn-toggle-view')
let isPreviewable = false

btnToggleView?.addEventListener('click', () => {
  isPreviewable = !isPreviewable
  if (isPreviewable) {
    container.classList.add('show-preview')
    btnToggleView.innerHTML = '<span class="material-symbols-outlined">edit</span>' // Switch to Edit icon
  } else {
    container.classList.remove('show-preview')
    btnToggleView.innerHTML = '<span class="material-symbols-outlined">visibility</span>' // Back to Preview icon
  }
})

// Initialize Editor
let onScrollHandler: (view: EditorView) => void = () => { }

// --- Collaboration Setup ---
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { yCollab } from 'y-codemirror.next'
import QRCode from 'qrcode'

// Get room from URL hash or generate new one
const getRoomFromUrl = () => {
  const hash = window.location.hash
  if (hash.startsWith('#room=')) {
    return hash.substring(6)
  }
  return null
}

const roomName = getRoomFromUrl() || `mde-room-${Math.random().toString(36).substring(2, 7)}`
// Update URL if new room
if (!getRoomFromUrl()) {
  window.history.replaceState(null, '', `#room=${roomName}`)
}

const ydoc = new Y.Doc()
const provider = new WebrtcProvider(roomName, ydoc, { signaling: ['wss://signaling.yjs.dev'] }) // Public signaling server for demo
const ytext = ydoc.getText('codemirror')

// Sync initial content if room is empty, otherwise let Yjs handle it
if (ytext.toString() === '') {
  ytext.insert(0, initialContent)
}

// Editor with Collaboration
const editorView = createEditor(editorPane, ytext.toString(), (doc) => {
  renderMarkdown(doc, previewPane)
  // localStorage.setItem(STORAGE_KEY, doc) // Optional: disable local storage sync to avoid conflicts or sync YDoc to indexeddb
}, (view) => {
  onScrollHandler(view)
}, (stats) => {
  const linesEl = document.getElementById('status-lines')
  const wordsEl = document.getElementById('status-words')
  if (linesEl) linesEl.textContent = `Ln ${stats.cursorLine}, Col ${stats.cursorCol}`
  if (wordsEl) wordsEl.textContent = `${stats.words} words`
}, [
  yCollab(ytext, provider.awareness)
])

// Initialize Preview
renderMarkdown(ytext.toString(), previewPane)

// Initialize Scroll Sync
const { onEditorScroll } = setupScrollSync(editorView, previewPane)
onScrollHandler = onEditorScroll

// Initialize File System Access
setupFileSystem(editorView, (content) => {
  // When loading file, replace Yjs content
  const currentLength = ytext.length
  if (currentLength > 0) ytext.delete(0, currentLength)
  ytext.insert(0, content)

  renderMarkdown(content, previewPane)
})

// Initialize TOC
setupTOC(editorView)

// Export Buttons
document.getElementById('btn-export-md')?.addEventListener('click', () => {
  const content = editorView.state.doc.toString()
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'document.md'
  a.click()
  URL.revokeObjectURL(url)
})

document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
  window.print()
})


// --- Share / QR Code ---
const btnShare = document.createElement('button')
btnShare.id = 'btn-share'
btnShare.className = 'icon-btn'
btnShare.title = 'Share with Mobile'
btnShare.innerHTML = '<span class="material-symbols-outlined">qr_code_2</span>'
// Insert before Save button
const toolbarGroup = document.querySelector('.toolbar-group')
const btnSave = document.getElementById('btn-save')
if (toolbarGroup && btnSave) {
  toolbarGroup.insertBefore(btnShare, btnSave)
}

// Modal Logic
btnShare.addEventListener('click', async () => {
  const url = window.location.href

  // Create Modal Elements
  const modalOverlay = document.createElement('div')
  Object.assign(modalOverlay.style, {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(5px)'
  })

  const modalContent = document.createElement('div')
  Object.assign(modalContent.style, {
    backgroundColor: '#161b22', padding: '32px', borderRadius: '12px',
    textAlign: 'center', color: '#fff', border: '1px solid #30363d',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  })

  const title = document.createElement('h2')
  title.textContent = 'Scan to Join'
  title.style.marginTop = '0'

  const canvas = document.createElement('canvas')
  await QRCode.toCanvas(canvas, url, { width: 256, margin: 2, color: { dark: '#000000', light: '#ffffff' } })

  const closeBtn = document.createElement('button')
  closeBtn.textContent = 'Close'
  Object.assign(closeBtn.style, {
    marginTop: '20px', padding: '8px 16px', backgroundColor: '#3b82f6',
    color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer',
    fontSize: '14px', fontWeight: '500'
  })

  closeBtn.onclick = () => document.body.removeChild(modalOverlay)
  modalOverlay.onclick = (e) => { if (e.target === modalOverlay) document.body.removeChild(modalOverlay) }

  modalContent.appendChild(title)
  modalContent.appendChild(canvas)
  modalContent.appendChild(document.createElement('br'))
  modalContent.appendChild(closeBtn)
  modalOverlay.appendChild(modalContent)
  document.body.appendChild(modalOverlay)
})
