/**
 * Pathway flow (headed): ASHA create screening → CHO forward → MO book.
 */
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.CARESETU_URL || 'http://localhost:5174'
const API = process.env.CARESETU_API || 'http://localhost:18080/api/v1'
const OUT = path.resolve('ui-walk-shots/pathway')
const results = []
const patientName = `Flow Test ${Date.now().toString().slice(-6)}`

const ROLES = {
  ASHA: '9876543210',
  CHO: '9876543211',
  MO: '9876543212',
  HOSP: '9876543213',
}

async function shot(page, name) {
  const file = path.join(OUT, `${String(results.length + 1).padStart(2, '0')}-${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  return file
}

async function step(page, name, fn) {
  try {
    await fn()
    await page.waitForTimeout(450)
    const file = await shot(page, name)
    results.push({ name, ok: true, file, url: page.url() })
    console.log(`PASS  ${name}  → ${page.url()}`)
  } catch (e) {
    const file = await shot(page, `${name}-FAIL`).catch(() => null)
    results.push({ name, ok: false, error: String(e?.message || e), file, url: page.url() })
    console.log(`FAIL  ${name}: ${e?.message || e}`)
    throw e
  }
}

async function apiLogin(mobile) {
  const deviceId = crypto.randomUUID()
  const send = await (
    await fetch(`${API}/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
      body: JSON.stringify({ mobile }),
    })
  ).json()
  if (!send?.success) throw new Error(`OTP send ${mobile}: ${send?.message}`)
  const json = await (
    await fetch(`${API}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
      body: JSON.stringify({ mobile, otp: '123456', deviceId }),
    })
  ).json()
  if (!json?.success) throw new Error(`OTP verify ${mobile}: ${json?.message}`)
  return { ...json.data, deviceId, mobile }
}

async function enterAs(page, role) {
  const tokens = await apiLogin(ROLES[role])
  console.log(`  auth ${role} · ${tokens.user?.fullName || tokens.mobile}`)
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
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => !document.body.innerText.includes('Starting CARESETU'))
  await page.waitForTimeout(800)
  if (page.url().includes('/login')) throw new Error(`${role} session not accepted`)
}

async function fillByLabel(page, label, value) {
  // Field component: <label class="field"><span>Label</span><input/></label>
  const field = page.locator('label.field', { hasText: label }).first()
  await field.locator('input, select, textarea').first().fill(value)
}

async function selectByLabel(page, label, value) {
  const field = page.locator('label.field', { hasText: label }).first()
  await field.locator('select').first().selectOption(value)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: false, slowMo: 120 })
  const page = await (await browser.newContext({ viewport: { width: 1360, height: 860 } })).newPage()
  page.setDefaultTimeout(25000)
  let patientUrl = ''

  try {
    await step(page, '01-asha-home', async () => {
      await enterAs(page, 'ASHA')
    })

    await step(page, '02-create-screening', async () => {
      await page.goto(`${BASE}/screening`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(700)
      await fillByLabel(page, 'Full name', patientName)
      await fillByLabel(page, 'Age', '52')
      await selectByLabel(page, 'Sex', 'F')
      await fillByLabel(page, 'Mobile', '9876500123')
      await fillByLabel(page, 'Village', 'Adalaj flow village')
      const phc = page.locator('label.field', { hasText: 'PHC' }).locator('select')
      const current = await phc.inputValue()
      if (!current) {
        const val = await phc.locator('option').nth(1).getAttribute('value')
        if (!val) throw new Error('No PHC options')
        await phc.selectOption(val)
      }
      await fillByLabel(
        page,
        'Findings',
        'Ulcer on left buccal mucosa for 3 weeks, bleeding on touch, urgent referral needed',
      )
      await page.getByRole('button', { name: 'Save screening' }).click()
      await page.waitForURL(/\/patients\//, { timeout: 20000 })
      patientUrl = page.url()
      await page.getByRole('heading', { name: patientName }).waitFor({ state: 'visible', timeout: 20000 })
      await page.locator('.chip', { hasText: 'CHO' }).first().waitFor({ state: 'visible', timeout: 10000 })
    })

    await step(page, '03-cho-forward', async () => {
      await enterAs(page, 'CHO')
      await page.goto(patientUrl, { waitUntil: 'domcontentloaded' })
      await page.getByRole('heading', { name: patientName }).waitFor({ state: 'visible', timeout: 20000 })
      const forward = page.getByRole('button', { name: /Forward to MO/i })
      await forward.waitFor({ state: 'visible', timeout: 15000 })
      await forward.click()
      await page.locator('.chip', { hasText: 'REVIEW' }).first().waitFor({ state: 'visible', timeout: 15000 })
    })

    await step(page, '04-mo-book', async () => {
      await enterAs(page, 'MO')
      await page.goto(patientUrl, { waitUntil: 'domcontentloaded' })
      await page.getByRole('heading', { name: patientName }).waitFor({ state: 'visible', timeout: 20000 })
      await page.getByText(/Approve & book/i).first().waitFor({ state: 'visible', timeout: 15000 })
      const dayBtn = page.locator('.pool button:not([disabled])').first()
      await dayBtn.waitFor({ state: 'visible', timeout: 15000 })
      await dayBtn.click()
      await page.getByRole('button', { name: /Confirm booking/i }).click()
      await page.locator('.chip', { hasText: 'BOOKED' }).first().waitFor({ state: 'visible', timeout: 15000 })
    })

    await step(page, '05-timeline-print', async () => {
      await page.goto(patientUrl, { waitUntil: 'domcontentloaded' })
      await page.getByRole('heading', { name: patientName }).waitFor({ state: 'visible', timeout: 20000 })
      await page.locator('.chip', { hasText: 'BOOKED' }).first().waitFor({ state: 'visible' })
      await page.getByText('Timeline').first().waitFor({ state: 'visible' })
      await page.getByRole('button', { name: /Print slip/i }).waitFor({ state: 'visible' })
    })
  } catch (e) {
    console.log('\nPathway stopped:', e.message || e)
  }

  const summary = {
    patientName,
    patientUrl,
    at: new Date().toISOString(),
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  }
  await writeFile(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2))
  console.log('\n---')
  console.log(`Pathway: Passed ${summary.passed} / ${results.length}, failed ${summary.failed}`)
  console.log(`Patient: ${patientName}`)
  console.log(`URL: ${patientUrl}`)
  console.log(`Shots: ${OUT}`)
  await page.waitForTimeout(2500)
  await browser.close()
  if (summary.failed) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
