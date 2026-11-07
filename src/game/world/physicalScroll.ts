/** CSS-3D monitor planes can receive wheel events without Chromium scrolling
 * their overflow pane. Route only real, unhandled wheel input inside that plane;
 * ordinary HTML, keyboard scrolling and browser zoom keep their native paths. */
export function scrollPhysicalScreen(event: WheelEvent, root: HTMLElement) {
  if (!event.cancelable || event.defaultPrevented || event.ctrlKey) return false
  for (const target of event.composedPath()) {
    if (!(target instanceof HTMLElement) || !root.contains(target)) continue
    const style = getComputedStyle(target)
    const unit = event.deltaMode === 1 ? parseFloat(style.lineHeight) || 16 : 1
    let dx = event.deltaX
    let dy = event.deltaY
    if (event.shiftKey && dx === 0) {
      dx = dy
      dy = 0
    }
    dx *= event.deltaMode === 2 ? target.clientWidth : unit
    dy *= event.deltaMode === 2 ? target.clientHeight : unit
    const top = target.scrollTop
    const left = target.scrollLeft
    if (/auto|scroll/.test(style.overflowY || style.overflow))
      target.scrollTop = Math.max(
        0,
        Math.min(target.scrollHeight - target.clientHeight, top + dy),
      )
    if (/auto|scroll/.test(style.overflowX || style.overflow))
      target.scrollLeft = Math.max(
        0,
        Math.min(target.scrollWidth - target.clientWidth, left + dx),
      )
    if (target.scrollTop !== top || target.scrollLeft !== left) {
      event.preventDefault()
      return true
    }
    if (target === root) break
  }
  return false
}
