import { handleContact } from '../server/contact.ts'

export const runtime = 'nodejs'

export function POST(request: Request): Promise<Response> {
  return handleContact(request, process.env)
}
