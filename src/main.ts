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

const editorView = createEditor(editorPane, initialContent, (doc) => {
  renderMarkdown(doc, previewPane)
  localStorage.setItem(STORAGE_KEY, doc)
}, (view) => {
  onScrollHandler(view)
}, (stats) => {
  const linesEl = document.getElementById('status-lines')
  const wordsEl = document.getElementById('status-words')
  if (linesEl) linesEl.textContent = `Ln ${stats.cursorLine}, Col ${stats.cursorCol}`
  if (wordsEl) wordsEl.textContent = `${stats.words} words`
})

// Initialize Preview
renderMarkdown(initialContent, previewPane)

// Initialize Scroll Sync
const { onEditorScroll } = setupScrollSync(editorView, previewPane)
onScrollHandler = onEditorScroll

// Initialize File System Access
setupFileSystem(editorView, (content) => {
  renderMarkdown(content, previewPane)
  localStorage.setItem(STORAGE_KEY, content)
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
