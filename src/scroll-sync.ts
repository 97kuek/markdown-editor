import { EditorView } from "codemirror"

export class ScrollSync {
    private editorView: EditorView
    private previewEl: HTMLElement
    private isScrollingEditor = false
    private isScrollingPreview = false
    private timeout: number | null = null

    constructor(editorView: EditorView, previewEl: HTMLElement) {
        this.editorView = editorView
        this.previewEl = previewEl

        this.init()
    }

    private init() {
        this.editorView.scrollDOM.addEventListener("scroll", this.onEditorScroll.bind(this))
        this.previewEl.addEventListener("scroll", this.onPreviewScroll.bind(this))
    }

    private onEditorScroll() {
        if (this.isScrollingPreview) return

        this.isScrollingEditor = true
        this.syncPreview()
        this.resetScrollState()
    }

    private onPreviewScroll() {
        if (this.isScrollingEditor) return

        this.isScrollingPreview = true
        this.syncEditor()
        this.resetScrollState()
    }

    private syncPreview() {
        const editorScroller = this.editorView.scrollDOM
        const totalHeight = editorScroller.scrollHeight - editorScroller.clientHeight
        const scrollTop = editorScroller.scrollTop
        const ratio = scrollTop / totalHeight

        const previewTotalHeight = this.previewEl.scrollHeight - this.previewEl.clientHeight
        this.previewEl.scrollTop = ratio * previewTotalHeight
    }

    private syncEditor() {
        const previewTotalHeight = this.previewEl.scrollHeight - this.previewEl.clientHeight
        const scrollTop = this.previewEl.scrollTop
        const ratio = scrollTop / previewTotalHeight

        const editorScroller = this.editorView.scrollDOM
        const totalHeight = editorScroller.scrollHeight - editorScroller.clientHeight
        editorScroller.scrollTop = ratio * totalHeight
    }

    private resetScrollState() {
        if (this.timeout) clearTimeout(this.timeout)
        this.timeout = window.setTimeout(() => {
            this.isScrollingEditor = false
            this.isScrollingPreview = false
        }, 100)
    }
}
