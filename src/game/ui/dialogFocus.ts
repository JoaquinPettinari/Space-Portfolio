import type { KeyboardEvent } from 'react'

const focusableSelector = 'button, a[href], input, textarea, select, [tabindex]'

/** Wrap native Tab order inside a modal, retaining roving-tabindex and disabled controls. */
export function trapDialogFocus(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'Tab' || event.defaultPrevented) return
  const root = event.currentTarget
  const controls = Array.from(
    root.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter((item) => {
    if (
      item.tabIndex < 0 ||
      item.matches(':disabled') ||
      item.closest('[hidden], [inert], [aria-hidden="true"]')
    )
      return false
    for (
      let parent: HTMLElement | null = item;
      parent;
      parent = parent.parentElement
    ) {
      const style = getComputedStyle(parent)
      if (style.display === 'none' || style.visibility === 'hidden')
        return false
      if (parent === root) break
    }
    return true
  })
  const first = controls[0],
    last = controls.at(-1)
  if (!first || !last) {
    event.preventDefault()
    root.focus()
    return
  }
  const active = document.activeElement
  // Headings and status messages may receive programmatic focus (tabindex=-1).
  // Enter the modal's native sequence in either direction from those anchors.
  if (!controls.some((item) => item === active)) {
    event.preventDefault()
    ;(event.shiftKey ? last : first).focus()
    return
  }
  if (event.shiftKey && active === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}
