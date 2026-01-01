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

// Use multiple public signaling servers for better reliability
const signalingServers = [
  'wss://signaling.yjs.dev',
  'wss://y-webrtc-signaling-eu.herokuapp.com',
  'wss://y-webrtc-signaling-us.herokuapp.com'
]

const provider = new WebrtcProvider(roomName, ydoc, {
  signaling: signalingServers,
  password: undefined, // Optional: add password protection if needed
  maxConns: 20 + Math.floor(Math.random() * 15), // Randomize slightly to avoid all peers connecting to same mesh
  filterBcConns: true,
  peerOpts: {} // default
})

const ytext = ydoc.getText('codemirror')

// Sync initial content if room is empty, otherwise let Yjs handle it
if (ytext.toString() === '') {
  ytext.insert(0, initialContent)
}

// Connection Status Indicator
const statusGroup = document.createElement('div')
statusGroup.className = 'status-item'
statusGroup.style.display = 'flex'
statusGroup.style.alignItems = 'center'
statusGroup.style.marginLeft = '10px'
statusGroup.style.fontSize = '12px'

const statusDot = document.createElement('span')
statusDot.style.width = '8px'
statusDot.style.height = '8px'
statusDot.style.borderRadius = '50%'
statusDot.style.backgroundColor = '#6e7681' // Disconnected gray
statusDot.style.marginRight = '6px'

const statusText = document.createElement('span')
statusText.textContent = 'Offline'
statusText.style.color = '#8b949e' // Muted text

statusGroup.appendChild(statusDot)
statusGroup.appendChild(statusText)

// Add to status bar (assuming there is one, or just append to toolbar for now)
const footer = document.querySelector('footer')
if (footer) {
  footer.insertBefore(statusGroup, footer.firstChild)
} else {
  // Fallback: add to toolbar if no footer
  // document.querySelector('.toolbar-group')?.appendChild(statusGroup) 
  // Actually, let's create a minimal footer if it doesn't exist or put it in top bar
  const toolbar = document.querySelector('.toolbar')
  if (toolbar) {
    statusGroup.style.marginLeft = 'auto'
    statusGroup.style.marginRight = '16px'
    toolbar.appendChild(statusGroup)
  }
}

// Monitor connection
provider.on('status', (event: any) => {
  if (event.status === 'connected') {
    statusDot.style.backgroundColor = '#2ea043' // Green
    statusText.textContent = 'Connected'
    statusText.style.color = '#c9d1d9'
  } else {
    statusDot.style.backgroundColor = '#f85149' // Red
    statusText.textContent = 'Disconnected'
    statusText.style.color = '#8b949e'
  }
})


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
const { onEditorScroll, setEnabled: setScrollSyncEnabled } = setupScrollSync(editorView, previewPane)
onScrollHandler = onEditorScroll

// --- Settings Logic ---
const SETTINGS_KEY = 'mde-settings'
let settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{"scrollSync": true}')

// Apply initial settings
setScrollSyncEnabled(settings.scrollSync)

document.getElementById('btn-settings')?.addEventListener('click', () => {
  // Create Modal (reuse logic or simple implementation)
  const modalOverlay = document.createElement('div')
  Object.assign(modalOverlay.style, {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(5px)'
  })

  const modalContent = document.createElement('div')
  Object.assign(modalContent.style, {
    backgroundColor: '#161b22', padding: '24px', borderRadius: '12px',
    color: '#fff', border: '1px solid #30363d', minWidth: '300px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  })

  const title = document.createElement('h2')
  title.textContent = 'Settings'
  title.style.marginTop = '0'
  title.style.borderBottom = '1px solid #30363d'
  title.style.paddingBottom = '12px'

  // Scroll Sync Toggle
  const toggleContainer = document.createElement('div')
  toggleContainer.style.display = 'flex'
  toggleContainer.style.alignItems = 'center'
  toggleContainer.style.justifyContent = 'space-between'
  toggleContainer.style.marginTop = '16px'

  const label = document.createElement('span')
  label.textContent = 'Scroll Sync'

  const toggleInput = document.createElement('input')
  toggleInput.type = 'checkbox'
  toggleInput.checked = settings.scrollSync
  toggleInput.style.transform = 'scale(1.5)'

  toggleInput.addEventListener('change', () => {
    settings.scrollSync = toggleInput.checked
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    setScrollSyncEnabled(settings.scrollSync)
  })

  toggleContainer.appendChild(label)
  toggleContainer.appendChild(toggleInput)

  const closeBtn = document.createElement('button')
  closeBtn.textContent = 'Close'
  Object.assign(closeBtn.style, {
    marginTop: '24px', width: '100%', padding: '8px',
    backgroundColor: '#3b82f6', color: 'white', border: 'none',
    borderRadius: '6px', cursor: 'pointer'
  })
  closeBtn.onclick = () => document.body.removeChild(modalOverlay)
  modalOverlay.onclick = (e) => { if (e.target === modalOverlay) document.body.removeChild(modalOverlay) }

  modalContent.appendChild(title)
  modalContent.appendChild(toggleContainer)
  modalContent.appendChild(closeBtn)
  modalOverlay.appendChild(modalContent)
  document.body.appendChild(modalOverlay)
})

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
  // Initial URL
  let currentUrl = window.location.href

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
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    maxWidth: '90%', width: '400px'
  })

  const title = document.createElement('h2')
  title.textContent = 'Scan to Join'
  title.style.marginTop = '0'

  const canvas = document.createElement('canvas')
  // Wrapper for canvas to center it and set min-height to prevent jumping
  const canvasContainer = document.createElement('div')
  canvasContainer.style.display = 'flex'
  canvasContainer.style.justifyContent = 'center'
  canvasContainer.style.margin = '20px 0'
  canvasContainer.appendChild(canvas)

  const updateQRCode = async (urlToEncode: string) => {
    try {
      await QRCode.toCanvas(canvas, urlToEncode, { width: 256, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
    } catch (err) {
      console.error('QR Gen Error', err)
    }
  }

  // Initial generation
  await updateQRCode(currentUrl)

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
  // Input field for manual IP
  const inputContainer = document.createElement('div')
  inputContainer.style.textAlign = 'left'
  inputContainer.style.marginBottom = '10px'

  const inputLabel = document.createElement('label')
  inputLabel.textContent = 'URL (Edit local IP if needed):'
  inputLabel.style.display = 'block'
  inputLabel.style.marginBottom = '5px'
  inputLabel.style.fontSize = '12px'
  inputLabel.style.color = '#8b949e'

  const urlInput = document.createElement('input')
  urlInput.type = 'text'
  urlInput.value = currentUrl
  Object.assign(urlInput.style, {
    width: '100%', padding: '8px', borderRadius: '6px',
    border: '1px solid #30363d', backgroundColor: '#0d1117', color: '#c9d1d9',
    boxSizing: 'border-box'
  })

  urlInput.addEventListener('input', async () => {
    const newUrl = urlInput.value
    await updateQRCode(newUrl)
    // Check for localhost warning dynamically
    if (newUrl.includes('localhost') || newUrl.includes('127.0.0.1')) {
      warning.style.display = 'block'
    } else {
      warning.style.display = 'none'
    }
  })

  inputContainer.appendChild(inputLabel)
  inputContainer.appendChild(urlInput)

  modalContent.appendChild(canvasContainer)
  modalContent.appendChild(inputContainer)

  // Warning for localhost
  const warning = document.createElement('p')
  warning.innerHTML = '⚠️ <b>localhost</b> detected.<br>Replace "localhost" with your PC\'s Local IP (e.g., 192.168.x.x) to connect mobile.'
  warning.style.color = '#e3b341' // Warning yellow
  warning.style.fontSize = '12px'
  warning.style.marginTop = '10px'
  warning.style.display = (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) ? 'block' : 'none'

  modalContent.appendChild(warning)

  modalContent.appendChild(document.createElement('br'))
  modalContent.appendChild(closeBtn)
  modalOverlay.appendChild(modalContent)
  document.body.appendChild(modalOverlay)

  // Auto-select the "localhost" part if present to make it easy to type over
  if (currentUrl.includes('localhost')) {
    urlInput.focus()
    const start = currentUrl.indexOf('localhost')
    urlInput.setSelectionRange(start, start + 9)
  }
})
