import { EditorView } from "codemirror"

export function setupTOC(editorView: EditorView) {
    const btnTOC = document.getElementById('btn-toc')
    const tocPanel = document.getElementById('toc-panel')
    const tocList = document.getElementById('toc-list')

    if (!btnTOC || !tocPanel || !tocList) return

    // Toggle Panel
    btnTOC.addEventListener('click', (e) => {
        e.stopPropagation() // Prevent immediate close
        const isHidden = tocPanel.classList.toggle('hidden')
        if (!isHidden) {
            updateTOC()
        }
    })

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!tocPanel.classList.contains('hidden') && !tocPanel.contains(e.target as Node) && e.target !== btnTOC) {
            tocPanel.classList.add('hidden')
        }
    })

    function updateTOC() {
        if (!tocList) return
        tocList.innerHTML = ''

        const doc = editorView.state.doc
        const lines = doc.lines
        let hasHeaders = false

        for (let i = 1; i <= lines; i++) {
            const line = doc.line(i)
            const text = line.text.trim()

            // Simple regex for headers (1-6)
            const match = text.match(/^(#{1,6})\s+(.+)$/)
            if (match) {
                hasHeaders = true
                const level = match[1].length
                const title = match[2]

                const item = document.createElement('div')
                item.className = `toc-item h${level}`
                item.textContent = title

                // Click to scroll
                item.addEventListener('click', () => {
                    // Scroll editor to line
                    const pos = line.from
                    editorView.dispatch({
                        selection: { anchor: pos, head: pos },
                        effects: EditorView.scrollIntoView(pos, { y: 'center' })
                    })
                    // Close panel on mobile or always? Let's keep it open on desktop, close on mobile maybe.
                    // For now, keep open.
                })

                tocList.appendChild(item)
            }
        }

        if (!hasHeaders) {
            const empty = document.createElement('div')
            empty.className = 'toc-item'
            empty.textContent = '(No headers found)'
            empty.style.fontStyle = 'italic'
            tocList.appendChild(empty)
        }
    }
}
