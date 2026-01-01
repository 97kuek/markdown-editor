import { EditorView, basicSetup } from "codemirror"
import { markdown } from "@codemirror/lang-markdown"
import { oneDark } from "@codemirror/theme-one-dark"

export function createEditor(
    parent: HTMLElement,
    initialContent: string,
    onChange: (doc: string) => void,
    onScroll: (view: EditorView) => void
) {
    const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
            onChange(update.state.doc.toString())
        }
    })

    const view = new EditorView({
        doc: initialContent,
        extensions: [
            basicSetup,
            markdown(),
            oneDark,
            updateListener,
            EditorView.lineWrapping,
        ],
        parent: parent
    })

    // Attach scroll listener
    view.scrollDOM.addEventListener("scroll", () => {
        onScroll(view)
    })

    return view
}
