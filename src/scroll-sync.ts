import { EditorView } from "codemirror"

export function setupScrollSync(editorView: EditorView, preview: HTMLElement) {
    let isScrolling = false
    let timeoutId: any = null

    // Helper to prevent sync loop
    const markScrolling = () => {
        isScrolling = true
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
            isScrolling = false
        }, 100)
    }

    // 1. Editor -> Preview
    const onEditorScroll = () => {
        if (isScrolling) return
        markScrolling()

        const editorScrollTop = editorView.scrollDOM.scrollTop
        const editorHeight = editorView.scrollDOM.clientHeight
        const contentHeight = editorView.scrollDOM.scrollHeight

        // Handle edge cases (top/bottom)
        if (editorScrollTop === 0) {
            preview.scrollTop = 0
            return
        }
        if (editorScrollTop + editorHeight >= contentHeight - 50) {
            preview.scrollTop = preview.scrollHeight - preview.clientHeight
            return
        }

        // Logical Sync
        // Find the first visible line in the editor
        const lineInfo = editorView.lineBlockAtHeight(editorScrollTop)
        const lineNumber = editorView.state.doc.lineAt(lineInfo.from).number

        // Find the element in preview with closest data-source-line
        const elements = Array.from(preview.querySelectorAll('[data-source-line]')) as HTMLElement[]

        // Find closest element
        let targetElement: HTMLElement | null = null
        let minDiff = Infinity

        for (const el of elements) {
            const line = parseInt(el.getAttribute('data-source-line') || '0', 10)
            if (line >= lineNumber) {
                const diff = line - lineNumber
                if (diff < minDiff) {
                    minDiff = diff
                    targetElement = el
                }
            }
        }

        if (targetElement) {
            // Scroll preview to this element
            const elTop = targetElement.offsetTop
            preview.scrollTo({ top: elTop, behavior: 'auto' })
        }
    }

    // 2. Preview -> Editor
    const onPreviewScroll = () => {
        if (isScrolling) return
        markScrolling()

        const previewScrollTop = preview.scrollTop
        const previewHeight = preview.clientHeight

        // Edge cases
        if (previewScrollTop === 0) {
            editorView.scrollDOM.scrollTop = 0
            return
        }
        if (previewScrollTop + previewHeight >= preview.scrollHeight - 50) {
            editorView.scrollDOM.scrollTop = editorView.scrollDOM.scrollHeight
            return
        }

        // Find visible element
        const elements = Array.from(preview.querySelectorAll('[data-source-line]')) as HTMLElement[]

        let targetLine = 1

        // Find the element that is at or just below the top of the scroll container
        for (const el of elements) {
            const elTop = el.offsetTop
            // We want the element that is currently visible at the top
            // Check if this element is near the scrollTop
            if (elTop >= previewScrollTop) {
                const line = parseInt(el.getAttribute('data-source-line') || '0', 10)
                if (line > 0) {
                    targetLine = line
                    break
                }
            }
        }

        // Scroll Editor to that line
        try {
            const line = editorView.state.doc.line(targetLine)
            editorView.dispatch({
                effects: EditorView.scrollIntoView(line.from, { y: 'start' })
            })
        } catch (e) {
            // Line might be out of range if document changed rapidly
        }
    }

    // Attach Preview Listener
    preview.addEventListener('scroll', onPreviewScroll)

    // Return Editor Listener (to be attached via CM hook)
    return { onEditorScroll }
}
