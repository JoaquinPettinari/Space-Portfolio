import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'

// A protocol smoke check: no application tests depend on MCP.
const server = spawn(
  process.execPath,
  [
    'node_modules/@playwright/mcp/cli.js',
    '--config',
    'playwright.mcp.config.json',
  ],
  { stdio: ['pipe', 'pipe', 'inherit'], windowsHide: true },
)
let sequence = 0
const pending = new Map()
const lines = createInterface({ input: server.stdout })
lines.on('line', (line) => {
  const message = JSON.parse(line)
  if (message.id !== undefined) pending.get(message.id)?.(message)
})
async function request(method, params = {}) {
  const id = ++sequence
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id)
      reject(new Error(`Timeout: ${method}`))
    }, 60_000)
    pending.set(id, (message) => {
      clearTimeout(timeout)
      pending.delete(id)
      if (message.error) reject(new Error(JSON.stringify(message.error)))
      else resolve(message.result)
    })
    server.stdin.write(
      `${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`,
    )
  })
}
try {
  console.log(
    JSON.stringify(
      await request('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'space-portfolio-verification', version: '1.0.0' },
      }),
    ),
  )
  server.stdin.write(
    `${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`,
  )
  const { tools } = await request('tools/list')
  console.log(
    JSON.stringify(
      tools.filter(({ name }) =>
        [
          'browser_navigate',
          'browser_take_screenshot',
          'browser_console_messages',
          'browser_snapshot',
          'browser_click',
          'browser_close',
        ].includes(name),
      ),
    ),
  )
  if (process.argv[2]) {
    const call = async (name, args) => {
      const result = await request('tools/call', { name, arguments: args })
      for (const item of result.content ?? [])
        if (item.type === 'text') console.log(item.text)
      if (result.isError) throw new Error(`MCP tool failed: ${name}`)
      return result
    }
    await call('browser_navigate', { url: process.argv[2] })
    await call('browser_click', {
      target: 'button',
      element: 'Cargar experiencia 3D',
    })
    await call('browser_snapshot', {})
    await call('browser_take_screenshot', {
      filename: 'artifacts/mcp-station.png',
      scale: 'css',
    })
    await call('browser_console_messages', { level: 'error', all: true })
    await call('browser_close', {})
  }
} finally {
  lines.close()
  server.stdin.end()
  server.kill()
}
