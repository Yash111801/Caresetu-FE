/**
 * Headed whole-app UI walk — one login, SPA navigations (no /auth/me burst).
 */
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.CARESETU_URL || 'http://localhost:5174'
const API = process.env.CARESETU_API || 'http://localhost:18080/api/v1'
const OUT = path.resolve('ui-walk-shots')
const results = []

async function shot(page, name) {
  const file = path.join(OUT, `${String(results.length + 1).padStart(2, '0')}-${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  return file
}

async function step(page, name, fn) {
  try {
    await fn()
    await page.waitForTimeout(400)
    const file = await shot(page, name)
    results.push({ name, ok: true, file, url: page.url() })
    console.log(`PASS  ${name}  → ${page.url()}`)
  } catch (e) {
    const file = await shot(page, `${name}-FAIL`).catch(() => null)
    results.push({ name, ok: false, error: String(e?.message || e), file, url: page.url() })
    console.log(`FAIL  ${name}: ${e?.message || e}`)
  }
}

async function loginApi() {
  const mobiles = [
    '9999999999',
    '9876543210',
    '9876543211',
    '9876543212',
    '9876543213',
    '9876543214',
    '9876543215',
    '9876543216',
    '9876543217',
    '9876543218',
    '9876543219',
  ]
  let lastErr = 'OTP failed'
  for (const mobile of mobiles) {
    const deviceId = crypto.randomUUID()
    const send = await (
      await fetch(`${API}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
        body: JSON.stringify({ mobile }),
      })
    ).json()
    if (!send?.success) {
      lastErr = send?.message || lastErr
      await new Promise((r) => setTimeout(r, 400))
      continue
    }
    const json = await (
      await fetch(`${API}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
        body: JSON.stringify({ mobile, otp: '123456', deviceId }),
      })
    ).json()
    if (json?.success && json?.data?.accessToken) return { ...json.data, deviceId, mobile }
    lastErr = json?.message || lastErr
  }
  throw new Error(`OTP verify failed: ${lastErr}`)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const tokens = await loginApi()
  console.log('Auth OK as', tokens.user?.fullName || tokens.mobile)

  const browser = await chromium.launch({ headless: false, slowMo: 120 })
  const context = await browser.newContext({ viewport: { width: 1360, height: 860 } })
  const page = await context.newPage()
  page.setDefaultTimeout(20000)

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.evaluate((a) => {
    localStorage.setItem('caresetu.access', a.accessToken)
    localStorage.setItem('caresetu.refresh', a.refreshToken)
    localStorage.setItem('caresetu.deviceId', a.deviceId)
  }, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    deviceId: tokens.deviceId,
  })

  // Single bootstrap load
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => !document.body.innerText.includes('Starting CARESETU'))
  await page.waitForTimeout(1000)
  if (page.url().includes('/login')) throw new Error('Failed to enter app after auth seed')

  const routes = [
    ['home', '/'],
    ['patients', '/patients'],
    ['screening', '/screening'],
    ['add-patient', '/add-patient'],
    ['appointments', '/appointments'],
    ['dashboard', '/dashboard'],
    ['intervals', '/intervals'],
    ['audit', '/audit'],
    ['map', '/map'],
    ['alerts', '/alerts'],
    ['messages', '/messages'],
    ['finder', '/finder'],
    ['settings', '/settings'],
    ['help', '/help'],
    ['about', '/about'],
  ]

  for (const [name, route] of routes) {
    await step(page, name, async () => {
      // Soft navigate via history API + React Router by clicking a temp link
      await page.evaluate((to) => {
        const a = document.createElement('a')
        a.href = to
        a.id = 'ui-walk-nav'
        document.body.appendChild(a)
        a.click()
        a.remove()
      }, route)
      await page.waitForTimeout(800)
      // Fallback if RR ignored the click
      if (!page.url().endsWith(route) && page.url().replace(/\/$/, '') !== `${BASE}${route}`.replace(/\/$/, '')) {
        await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(700)
      }
      if (page.url().includes('/login')) throw new Error(`Logged out on ${route}`)
      await page.locator('h1').first().waitFor({ state: 'visible' })
      const title = (await page.locator('h1').first().textContent()) || ''
      if (/Sign in/i.test(title)) throw new Error(`Login shown for ${route}`)
      if (['/screening', '/add-patient', '/finder'].includes(route)) {
        const age = page.locator('input[type="number"]').first()
        if (await age.count()) {
          const v = await age.inputValue()
          if (v === '45' || v === '50') throw new Error(`Age still prefilled as ${v}`)
        }
      }
    })
  }

  await step(page, 'patient-detail', async () => {
    await page.evaluate(() => {
      const a = document.querySelector('a[href="/patients"]')
      if (a) a.click()
      else window.location.assign('/patients')
    })
    await page.waitForTimeout(900)
    const card = page.locator('.patient-card').first()
    await card.waitFor({ state: 'visible', timeout: 15000 })
    await card.click()
    await page.waitForURL(/\/patients\//)
    await page.locator('h1').first().waitFor()
  })

  await step(page, 'print-slip', async () => {
    const btn = page.getByRole('button', { name: /Print slip/i })
    await btn.waitFor({ state: 'visible' })
    await btn.click({ trial: true })
  })

  const summary = {
    base: BASE,
    at: new Date().toISOString(),
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  }
  await writeFile(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2))
  console.log('\n---')
  console.log(`Passed ${summary.passed} / ${results.length}, failed ${summary.failed}`)
  console.log(`Screenshots: ${OUT}`)
  await page.waitForTimeout(2500)
  await browser.close()
  if (summary.failed) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
