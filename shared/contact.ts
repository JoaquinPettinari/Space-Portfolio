export const CONTACT_LIMITS = { name: 100, email: 254, message: 5000 } as const

export type ContactMessage = { name: string; email: string; message: string }
export type ContactValidation =
  { data: ContactMessage; error?: never } | { error: string; data?: never }

function hasControlCharacters(value: string, multiline = false): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0)
    return (
      (code < 32 && !(multiline && [9, 10, 13].includes(code))) || code === 127
    )
  })
}

export function isEmail(value: string): boolean {
  return (
    value.length <= CONTACT_LIMITS.email &&
    /^[^\s<>@,;:]+@[^\s<>@,;:]+\.[^\s<>@,;:]+$/.test(value) &&
    !hasControlCharacters(value)
  )
}

export function validateContact(value: unknown): ContactValidation {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return { error: 'Please provide your name, email and message.' }
  const fields = value as Record<string, unknown>
  if (
    Object.keys(fields).some(
      (key) => !['name', 'email', 'message', 'website'].includes(key),
    ) ||
    (fields.website !== undefined && fields.website !== '')
  )
    return { error: 'Unable to submit this transmission.' }
  if (
    typeof fields.name !== 'string' ||
    typeof fields.email !== 'string' ||
    typeof fields.message !== 'string'
  )
    return { error: 'Please provide your name, email and message.' }
  const name = fields.name.trim()
  const email = fields.email.trim()
  const message = fields.message.trim()
  if (!name || name.length > CONTACT_LIMITS.name || hasControlCharacters(name))
    return { error: 'Enter a name of 1–100 characters on one line.' }
  if (!isEmail(email)) return { error: 'Enter a valid email address.' }
  if (
    !message ||
    message.length > CONTACT_LIMITS.message ||
    hasControlCharacters(message, true)
  )
    return { error: 'Enter a message of 1–5000 characters.' }
  return { data: { name, email, message } }
}
