export function enableResizer(
    resizer: HTMLElement,
    leftPane: HTMLElement,
    container: HTMLElement
) {
    let isResizing = false

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true
        e.preventDefault() // Good practice
        document.body.style.cursor = 'col-resize'
        resizer.classList.add('resizing')
    })

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return

        const containerRect = container.getBoundingClientRect()
        const containerWidth = containerRect.width
        const offset = e.clientX - containerRect.left

        // Limits (min 10%, max 90%)
        const minWidth = containerWidth * 0.1
        if (offset < minWidth || offset > containerWidth - minWidth) return

        const leftPercentage = (offset / containerWidth) * 100
        // Use Flex basis for smoother resizing
        leftPane.style.flex = `0 0 ${leftPercentage}%`
        // Right pane takes the rest via flex: 1, but we need to ensure it shrinks
        // Actually, setting left pane width is enough if right pane is flex: 1
    })

    document.addEventListener('mouseup', () => {
        isResizing = false
        document.body.style.cursor = 'default'
        resizer.classList.remove('resizing')
    })
}
