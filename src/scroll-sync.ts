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
                // Optimization: since elements are likely ordered, we can stop if we go too far
                // but DOM structure might be nested so simple break is risky without tree walking
            }
        }

        if (targetElement) {
            // Scroll preview to this element
            const elTop = targetElement.offsetTop
            preview.scrollTo({ top: elTop, behavior: 'auto' }) // auto instant, smooth might lag
        }
    }

    // 2. Preview -> Editor (Optional/Complex, sticking to Editor->Preview primary for now or simple percentage fallback?)
    // For now implementation asked for Image Paste sync consideration which implies Editor->Preview accuracy.

    // Attach current simple sync or enhanced?
    // User asked "Please consider scroll sync with image paste".
    // Logical line sync solves this because image lines in editor are just 1 line (reference) or folded line.
    // The preview image will have the matching data-line.
    // So jumping to that line will show the image top.

    return { onEditorScroll }
}
