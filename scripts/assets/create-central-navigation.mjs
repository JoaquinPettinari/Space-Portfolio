import { chromium } from '@playwright/test'
import { writeFile, mkdir } from 'node:fs/promises'
const dir = new URL('../../docs/assets/bridge/textures-final/', import.meta.url)
await mkdir(dir, { recursive: true })
const cyan = '#36ddeb',
  dim = '#125362',
  white = '#bbf6f5'
let s = `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="512" viewBox="0 0 2048 512"><defs><radialGradient id="bg"><stop stop-color="#06313c"/><stop offset="1" stop-color="#01090e"/></radialGradient><radialGradient id="earth" cx="35%" cy="30%"><stop stop-color="#48d9e9"/><stop offset=".7" stop-color="#096078"/><stop offset="1" stop-color="#021621"/></radialGradient><clipPath id="globe"><circle cx="1600" cy="266" r="166"/></clipPath></defs><rect width="2048" height="512" fill="url(#bg)"/>`
const path = (d, c = cyan, w = 2) =>
  (s += `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"/>`)
const text = (x, y, t, size = 21, c = cyan) =>
  (s += `<text x="${x}" y="${y}" fill="${c}" font-family="Consolas,monospace" font-size="${size}" letter-spacing="2">${t}</text>`)
const rect = (x, y, w, h, c = dim) =>
  (s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="none" stroke="${c}" stroke-width="2"/>`)
for (let x = 420; x < 1400; x += 50) path(`M${x} 70V450`, '#082b36', 1)
for (let y = 80; y < 450; y += 40) path(`M420 ${y}H1400`, '#082b36', 1)
path('M30 50H650L690 78H1230L1270 50H2018 M30 464H2018')
text(750, 45, 'CRUZ DEL SUR', 30, white)
text(822, 69, 'EXPLORATION VESSEL', 12)
rect(28, 90, 335, 345)
text(50, 128, 'NAV / ORBITAL TRACK', 23)
for (const [i, label, value] of [
  [0, 'FRAME', 'EARTH'],
  [1, 'MODE', 'OBSERVATION'],
  [2, 'LINK', 'LOCAL'],
  [3, 'VIEW', 'SIMULATION'],
]) {
  text(52, 185 + i * 52, label, 18)
  text(182, 185 + i * 52, value, 18, white)
}
for (let r = 0; r < 5; r++)
  s += `<ellipse cx="930" cy="280" rx="${72 + r * 85}" ry="${22 + r * 24}" stroke="${r === 0 ? white : cyan}" stroke-width="${r === 0 ? 3 : 1.5}" fill="none"/>`
path('M510 280H1375 M930 110V433', dim)
s += '<ellipse cx="930" cy="280" rx="23" ry="9" fill="#baffff"/>'
for (const [x, y] of [
  [692, 326],
  [1164, 237],
  [1000, 208],
]) {
  s += `<circle cx="${x}" cy="${y}" r="5" fill="${white}"/>`
  path(`M${x - 13} ${y}h26 M${x} ${y - 13}v26`)
}
text(580, 440, 'TRAJECTORY / REFERENCE DISPLAY', 16)
s +=
  '<circle cx="1600" cy="266" r="166" fill="url(#earth)" stroke="#49efff" stroke-width="3"/>'
s +=
  '<g clip-path="url(#globe)" fill="#65c2c5" opacity=".8"><path d="M1470 140l65-30 47 28-8 34 29 18-36 35-50-6-20 45-33-19-15-50z M1540 256l51 12 35 45-19 44-12 59-28-37-6-43-32-43z M1640 111l65 28 45 45 26 38-44 9-35-35-23 25-34-18-30-40z M1640 221l40 10 18 50-31 63-25-30-22-50z M1714 335l46 10 18 34-51 12-22-24z"/></g>'
for (let r of [52, 108, 160])
  s += `<ellipse cx="1600" cy="266" rx="${r}" ry="166" fill="none" stroke="#43c8d5" opacity=".55"/>`
for (let y of [170, 220, 270, 320, 370])
  path(`M1440 ${y}Q1600 ${y + 30}1760 ${y}`, '#46bccb', 1)
s +=
  '<ellipse cx="1600" cy="449" rx="152" ry="18" fill="none" stroke="#47eaf0"/>'
text(1480, 488, 'EARTH / SOL-03', 17)
rect(1820, 90, 200, 345)
text(1840, 128, 'SYSTEMS', 23)
for (let i = 0; i < 4; i++) {
  text(1840, 180 + i * 64, ['POWER', 'LIFE', 'THERMAL', 'COMMS'][i], 17)
  path(`M1840 ${198 + i * 64}H1995`, dim, 7)
  path(`M1840 ${198 + i * 64}H${1968 + i * 8}`, cyan, 4)
}
for (let i = 0; i < 26; i++) {
  const h = 8 + ((i * 19) % 37)
  path(`M${50 + i * 11} 419v-${h}`, cyan, 4)
}
for (let x = 35; x < 2015; x += 100) path(`M${x} 474v8`, dim, 1)
s += '</svg>'
await writeFile(new URL('central-navigation.svg', dir), s)
const browser = await chromium.launch({ channel: 'chromium' })
try {
  const page = await browser.newPage()
  const data = await page.evaluate(async (svg) => {
    const image = new Image()
    image.src = 'data:image/svg+xml;base64,' + btoa(svg)
    await image.decode()
    const c = document.createElement('canvas')
    c.width = 2048
    c.height = 512
    c.getContext('2d').drawImage(image, 0, 0)
    return c.toDataURL('image/png').split(',')[1]
  }, s)
  await writeFile(
    new URL('central-navigation.png', dir),
    Buffer.from(data, 'base64'),
  )
} finally {
  await browser.close()
}
