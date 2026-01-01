import { EditorView, basicSetup } from "codemirror"
import { markdown } from "@codemirror/lang-markdown"
import { oneDark } from "@codemirror/theme-one-dark"
import { EditorState } from "@codemirror/state"
import { lineNumbers, highlightActiveLine, highlightActiveLineGutter, keymap } from "@codemirror/view"
import { foldGutter, foldEffect } from "@codemirror/language"
import { search, searchKeymap } from "@codemirror/search"

export type EditorStats = {
    lines: number
    words: number
    cursorLine: number
    cursorCol: number
}

export function createEditor(
    parent: HTMLElement,
    initialContent: string,
    onChange: (doc: string) => void,
    onScroll: (view: EditorView) => void,
    onStatsUpdate: (stats: EditorStats) => void
) {
    const startState = EditorState.create({
        doc: initialContent,
        extensions: [
            basicSetup,
            markdown(),
            oneDark,
            EditorView.lineWrapping,
            // Explicitly ensure these are present
            lineNumbers(),
            highlightActiveLine(),
            highlightActiveLineGutter(),
            foldGutter(),
            search(),
            keymap.of(searchKeymap),
            EditorView.updateListener.of((update) => {
                if (update.docChanged || update.selectionSet) {
                    if (update.docChanged) {
                        onChange(update.state.doc.toString())
                    }

                    // Calculate Stats
                    const state = update.state
                    const doc = state.doc
                    const lines = doc.lines
                    const text = doc.toString()
                    const words = text.match(/\S+/g)?.length || 0 // Simple word count

                    const selection = state.selection.main
                    const cursorLine = doc.lineAt(selection.head).number
                    const cursorCol = selection.head - doc.lineAt(selection.head).from + 1

                    onStatsUpdate({ lines, words, cursorLine, cursorCol })
                }
            }),
            EditorView.domEventHandlers({
                scroll: (_event, view) => onScroll(view),
                paste(_event, view) {
                    const items = _event.clipboardData?.items
                    if (!items) return

                    for (const item of items) {
                        if (item.type.startsWith('image/')) {
                            _event.preventDefault()
                            const file = item.getAsFile()
                            if (!file) continue

                            const reader = new FileReader()
                            reader.onload = (e) => {
                                const result = e.target?.result as string
                                const id = `image-${Date.now()}`

                                // Insert reference link at cursor
                                const refLink = `![Image][${id}]`
                                // Dispatch the first transaction to insert the link
                                view.dispatch(view.state.replaceSelection(refLink))

                                // Now append definition at the end
                                // We need to get the new state after the first dispatch
                                const definition = `\n\n[${id}]: ${result}`
                                const currentDocLength = view.state.doc.length

                                view.dispatch({
                                    changes: { from: currentDocLength, insert: definition }
                                })

                                // Auto-fold the definition line
                                const newDoc = view.state.doc
                                const lastLine = newDoc.lineAt(newDoc.length)

                                view.dispatch({
                                    effects: foldEffect.of({ from: lastLine.from, to: lastLine.to })
                                })
                            }
                            reader.readAsDataURL(file)
                        }
                    }
                }
            })
        ]
    })

    const view = new EditorView({
        state: startState, // Use the created state
        parent: parent
    })

    // Attach scroll listener
    view.scrollDOM.addEventListener("scroll", () => {
        onScroll(view)
    })

    return view
}
