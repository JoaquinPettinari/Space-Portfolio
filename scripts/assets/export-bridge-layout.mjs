// Export the actual TypeScript layout rather than retyping terminal coordinates.
import fs from 'node:fs'
import ts from 'typescript'
const moduleUrl = (source) =>
  'data:text/javascript;base64,' +
  Buffer.from(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
  ).toString('base64')
const bridgeUrl = moduleUrl(
  fs.readFileSync('src/game/world/bridgeLayout.ts', 'utf8'),
)
const bridge = await import(bridgeUrl)
const command = await import(
  moduleUrl(
    fs
      .readFileSync('src/game/world/commandLayout.ts', 'utf8')
      .replace("'./bridgeLayout'", JSON.stringify(bridgeUrl)),
  )
)
fs.mkdirSync('docs/assets/bridge', { recursive: true })
fs.writeFileSync(
  'docs/assets/bridge/layout.json',
  JSON.stringify(
    {
      outline: bridge.BRIDGE_OUTLINE,
      roof: bridge.ROOF_PANELS,
      consoles: command.COMMAND_SEGMENTS.map(
        ({ collider, supportColliders, ...rest }) => rest,
      ),
      monitors: command.COMMAND_POSES,
      sideChairs: command.SIDE_CHAIRS,
    },
    null,
    2,
  ) + '\n',
)
