/**
 * CARESETU walkthrough recorder: real OTP logins, captions, visible cursor.
 * ASHA screening → CHO forward → MO approve & book → HOSP next step → oversight tools.
 */
import { chromium } from 'playwright'
import { mkdir, readdir, rename } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.CARESETU_URL || 'http://127.0.0.1:5174'
const OUT = path.resolve(process.env.OUT_DIR || 'walkthrough-video')
const W = 1280
const H = 800
const PATIENT = process.env.PATIENT_NAME || 'Meena Patel'
const ROLE_LABEL = {
  ASHA: 'ASHA worker',
  CHO: 'Community Health Officer',
  MO: 'PHC Medical Officer',
  HOSP: 'Hospital doctor',
  ADMIN: 'Super Admin',
}

const overlay = () => {
  const KEY = '__cs_caption'
  const install = () => {
    if (document.getElementById('__cs_cursor')) return
    const st = document.createElement('style')
    st.textContent = `
      #__cs_cursor{position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;
        background:rgba(255,120,40,.35);border:2px solid rgba(255,100,20,.95);z-index:2147483647;pointer-events:none;
        transition:transform .12s ease, background .12s;}
      #__cs_cursor.down{transform:scale(.7);background:rgba(255,100,20,.75)}
      #__cs_cap{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);max-width:1040px;z-index:2147483646;
        pointer-events:none;background:rgba(17,24,39,.9);color:#fff;font:600 19px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
        padding:12px 22px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.3);text-align:center;transition:opacity .25s}
      #__cs_cap small{display:block;font-weight:500;font-size:14px;opacity:.8;margin-top:2px}
      #__cs_cap .tag{display:inline-block;background:#f97316;color:#fff;border-radius:6px;padding:1px 8px;margin-right:10px;font-size:14px;vertical-align:2px}
      #__cs_card{position:fixed;inset:0;z-index:2147483645;display:flex;flex-direction:column;align-items:center;justify-content:center;
        background:linear-gradient(135deg,#0f3d3e,#14532d);color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center;padding:40px}
      #__cs_card h1{font-size:54px;margin:0 0 10px;letter-spacing:.5px}
      #__cs_card p{font-size:22px;opacity:.9;margin:6px 0;max-width:900px;line-height:1.45}
      #__cs_card .flow{margin-top:26px;font-size:20px;font-weight:600;background:rgba(255,255,255,.12);padding:12px 22px;border-radius:12px}
    `
    document.documentElement.appendChild(st)
    const c = document.createElement('div')
    c.id = '__cs_cursor'
    document.documentElement.appendChild(c)
    const saved = (() => { try { return JSON.parse(sessionStorage.getItem('__cs_xy') || 'null') } catch { return null } })()
    if (saved) { c.style.left = saved[0] + 'px'; c.style.top = saved[1] + 'px' }
    window.addEventListener('mousemove', (e) => {
      c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'
      try { sessionStorage.setItem('__cs_xy', JSON.stringify([e.clientX, e.clientY])) } catch {}
    }, true)
    window.addEventListener('mousedown', () => c.classList.add('down'), true)
    window.addEventListener('mouseup', () => c.classList.remove('down'), true)
    window.__csCaption = (html) => {
      try { sessionStorage.setItem(KEY, html || '') } catch {}
      let el = document.getElementById('__cs_cap')
      if (!html) { el?.remove(); return }
      if (!el) { el = document.createElement('div'); el.id = '__cs_cap'; document.documentElement.appendChild(el) }
      el.innerHTML = html
    }
    window.__csCard = (html) => {
      let el = document.getElementById('__cs_card')
      if (!html) { el?.remove(); return }
      if (!el) { el = document.createElement('div'); el.id = '__cs_card'; document.documentElement.appendChild(el) }
      el.innerHTML = html
    }
    const cap = (() => { try { return sessionStorage.getItem(KEY) } catch { return null } })()
    if (cap) window.__csCaption(cap)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install)
  else install()
}

let page
const pause = (ms) => page.waitForTimeout(ms)

async function caption(tag, text, sub) {
  if (!tag && !text) return page.evaluate(() => window.__csCaption?.(''))
  const html =`${tag ? `<span class="tag">${tag}</span>` : ''}${text}${sub ? `<small>${sub}</small>` : ''}`
  await page.evaluate((h) => window.__csCaption?.(h), html)
}
async function card(html, ms) {
  await page.evaluate((h) => window.__csCard?.(h), html)
  await pause(ms)
  await page.evaluate(() => window.__csCard?.(''))
}

async function moveTo(locator) {
  await locator.scrollIntoViewIfNeeded()
  const b = await locator.boundingBox()
  if (!b) throw new Error('no box')
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 18 })
  await pause(250)
}
async function click(locator, after = 700) {
  await locator.waitFor({ state: 'visible' })
  await moveTo(locator)
  await locator.click()
  await pause(after)
}
async function type(locator, text, delay = 55) {
  await click(locator, 200)
  await locator.fill('')
  await locator.pressSequentially(text, { delay })
  await pause(300)
}
const field = (label) => page.locator('label.field', { hasText: label }).first()

async function smoothScroll(dy, steps = 12) {
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dy / steps)
    await pause(45)
  }
  await pause(500)
}

async function login(role) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await caption(role, `Sign in as ${ROLE_LABEL[role]}`, 'Pick the role, send OTP to the registered mobile, enter demo OTP 123456')
  await pause(1200)
  await click(page.locator('.role-chips button', { hasText: new RegExp(`^${role}$`) }), 900)
  await click(page.getByRole('button', { name: 'Send OTP' }), 1000)
  await type(page.locator('input.otpin'), '123456', 110)
  await click(page.getByRole('button', { name: 'Sign in' }), 400)
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 })
  await page.waitForFunction(() => !document.body.innerText.includes('Starting CARESETU'))
  await page.waitForLoadState('networkidle')
  await pause(900)
}

async function logout() {
  await caption('', '')
  const btn = page.locator('.nav-logout').first()
  if (await btn.isVisible().catch(() => false)) {
    await click(btn, 1200)
  } else {
    await page.evaluate(() => localStorage.clear())
  }
  await page.waitForURL(/\/login/, { timeout: 15000 }).catch(() => {})
}

async function openPatient(name) {
  await click(page.locator('nav .nav-sub a').filter({ hasText: /^Patients$/ }).first(), 1000)
  await page.waitForLoadState('networkidle')
  const search = page.getByPlaceholder('Search name, UHID, mobile')
  await type(search, name, 60)
  await pause(900)
  await click(page.locator('main').getByText(name, { exact: false }).first(), 1200)
  await page.getByRole('heading', { name }).first().waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForLoadState('networkidle')
  await pause(800)
}

async function gotoNav(label) {
  await click(page.locator('nav .nav-sub a').filter({ hasText: new RegExp(`^${label}`) }).first(), 600)
  await page.waitForLoadState('networkidle')
  await pause(1600)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: OUT, size: { width: W, height: H } },
  })
  await ctx.addInitScript(overlay)
  page = await ctx.newPage()
  page.setDefaultTimeout(25000)

  // ---------- Intro ----------
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.mouse.move(W / 2, H / 2)
  await card(
    `<h1>CARESETU walkthrough</h1>
     <p>Cancer Referral and Service Tracking Utility</p>
     <p>One case, tracked from village screening to the hospital — each role unlocks the next step.</p>
     <div class="flow">ASHA screens → CHO reviews → MO approves &amp; books → Hospital → Pathology → Oncology</div>`,
    5500,
  )
  await caption('', 'OTP login — the role you sign in with decides what you see and can do', 'Demo OTP for every role: 123456')
  await pause(3000)

  // ---------- 1. ASHA ----------
  await card(`<h1>Step 1 · ASHA</h1><p>Screens people in the field and creates the case</p>`, 2600)
  await login('ASHA')
  await caption('ASHA', 'Home — the ASHA worklist for her PHC area', 'Next: start a new screening')
  await pause(2500)
  await gotoNav('New screening')
  await caption('ASHA', 'New screening — patient details', 'Name, age, sex, mobile, village and PHC')
  await type(field('Full name').locator('input'), PATIENT)
  await type(field('Age').locator('input'), '48', 90)
  await moveTo(field('Sex').locator('select'))
  await field('Sex').locator('select').selectOption('F')
  await pause(500)
  await type(field('Mobile').locator('input'), '9876500123', 45)
  await type(field('Village').locator('input'), 'Adalaj')
  const phc = field('PHC').locator('select')
  if (!(await phc.inputValue())) {
    const v = await phc.locator('option').nth(1).getAttribute('value')
    await moveTo(phc)
    await phc.selectOption(v)
    await pause(500)
  }
  await caption('ASHA', 'Clinical finding — cancer type, presentation and notes')
  await click(page.locator('.seg button', { hasText: 'Oral' }).first(), 500)
  await click(page.locator('.seg button', { hasText: 'Symptomatic' }).first(), 500)
  await type(
    field('Findings').locator('textarea'),
    'Non-healing ulcer on left buccal mucosa for 3 weeks, bleeds on touch. Tobacco chewer.',
    22,
  )
  const counsel = page.locator('label.check input[type=checkbox]').first()
  if (await counsel.isVisible().catch(() => false)) await click(counsel, 500)
  await caption('ASHA', 'Save screening — the case is created and sent to the CHO')
  await click(page.getByRole('button', { name: 'Save screening' }), 300)
  await page.waitForURL(/\/patients\//, { timeout: 20000 })
  const patientUrl = page.url()
  await page.getByRole('heading', { name: PATIENT }).first().waitFor({ state: 'visible' })
  await page.locator('.chip', { hasText: 'CHO' }).first().waitFor({ state: 'visible' })
  await page.waitForLoadState('networkidle')
  await caption('ASHA', `Case created — stage chip shows <b>CHO</b>`, 'Waiting for the Community Health Officer to review')
  await moveTo(page.locator('.chip', { hasText: 'CHO' }).first())
  await pause(3500)
  await logout()

  // ---------- 2. CHO ----------
  await card(`<h1>Step 2 · CHO</h1><p>Reviews the ASHA finding and forwards it to the Medical Officer</p>`, 2600)
  await login('CHO')
  await caption('CHO', 'CHO home — cases waiting for review', 'Open the patient from the Patients worklist')
  await pause(2200)
  await openPatient(PATIENT)
  await caption('CHO', 'Patient page — stage chip, details and Available actions', 'CHO only sees “Forward to MO” while the stage is CHO')
  await pause(2500)
  const fwd = page.getByRole('button', { name: /Forward to MO/i })
  await fwd.scrollIntoViewIfNeeded()
  await pause(1500)
  await click(fwd, 600)
  await page.locator('.chip', { hasText: 'REVIEW' }).first().waitFor({ state: 'visible' })
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await pause(700)
  await caption('CHO', `Forwarded — stage is now <b>REVIEW</b>`, 'Waiting for the MO to approve and book')
  await moveTo(page.locator('.chip', { hasText: 'REVIEW' }).first())
  await pause(3200)
  await logout()

  // ---------- 3. MO ----------
  await card(`<h1>Step 3 · MO</h1><p>Approves the referral and books a hospital slot</p>`, 2600)
  await login('MO')
  await caption('MO', 'MO home — referrals waiting for approval')
  await pause(2200)
  await openPatient(PATIENT)
  await caption('MO', 'Approve & book — choose the facility and an open day', 'Each day shows how many slots are left')
  const pool = page.locator('.pool').first()
  await pool.scrollIntoViewIfNeeded()
  await pause(1800)
  await click(page.locator('.pool button:not([disabled])').first(), 1000)
  await caption('MO', 'Confirm booking')
  await click(page.getByRole('button', { name: /Confirm booking/i }), 600)
  await page.locator('.chip', { hasText: 'BOOKED' }).first().waitFor({ state: 'visible' })
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await pause(700)
  await caption('MO', `Booked — stage is now <b>BOOKED</b>`, 'The hospital now sees this visit; SMS/IVRS reminders go to the patient')
  await moveTo(page.locator('.chip', { hasText: 'BOOKED' }).first())
  await pause(3000)
  const print = page.getByRole('button', { name: /Print slip/i }).first()
  if (await print.isVisible().catch(() => false)) {
    await caption('MO', '“Print slip” gives the patient a referral slip for the booked visit')
    await moveTo(print)
    await pause(2600)
  }
  await caption('MO', 'Timeline — every hand-off is recorded with who did it and when')
  const tl = page.getByRole('heading', { name: 'Timeline' }).first()
  await tl.scrollIntoViewIfNeeded()
  await smoothScroll(250)
  await pause(3500)
  await logout()

  // ---------- 4. Mid-flow demo patient (HOSP) ----------
  await card(
    `<h1>Next in the pathway</h1>
     <p>Demo data already has patients parked at every stage — jump in mid-flow</p>
     <div class="flow">BOOKED → Hospital records visit → TESTED → Pathology → ONCO_REQ → Oncology</div>`,
    3800,
  )
  await login('HOSP')
  await caption('HOSP', 'Hospital doctor — today’s booked visits')
  await pause(2400)
  await openPatient('Ramesh')
  await caption('HOSP', 'Ramesh is at <b>BOOKED</b> — the hospital records attendance or “could not serve”', 'That moves him to TESTED, then PATH reports, and positives go to oncology')
  const acts = page.getByRole('heading', { name: 'Available actions' }).first()
  if (await acts.isVisible().catch(() => false)) {
    await acts.scrollIntoViewIfNeeded()
    await pause(600)
  }
  await pause(4500)
  await logout()

  // ---------- 5. Oversight ----------
  await card(`<h1>Oversight</h1><p>ADMIN / Block / District / State / National — dashboards, maps and alerts</p>`, 2800)
  await login('ADMIN')
  for (const [nav, text, sub] of [
    ['Dashboard', 'Dashboard — programme KPIs across the pathway', null],
    ['Map', 'Map — facilities and cases on the ground', null],
    ['Alerts', 'Alerts — missed visits and overdue steps', null],
    ['Messages', 'Messages — SMS / IVRS sent to patients', null],
    ['Hospital finder', 'Hospital finder — which facility offers which service', null],
  ]) {
    const link = page.locator('nav .nav-sub a').filter({ hasText: new RegExp(`^${nav}`) }).first()
    if (!(await link.isVisible().catch(() => false))) continue
    await caption('ADMIN', text, sub)
    await gotoNav(nav)
    await pause(1600)
  }
  await caption('', '')

  // ---------- Outro ----------
  await card(
    `<h1>That’s the CARESETU flow</h1>
     <div class="flow">ASHA → CHO → MO → Hospital → Pathology → Oncology → Closed</div>
     <p style="margin-top:22px">Log in as a role · open a patient · do the next action · the next role picks it up</p>`,
    5000,
  )

  const video = page.video()
  await ctx.close()
  await browser.close()
  const src = await video.path()
  const dest = path.join(OUT, 'caresetu-walkthrough.webm')
  await rename(src, dest)
  console.log('VIDEO', dest, 'patient', patientUrl)
}

main().catch(async (e) => {
  console.error('FAILED', e)
  try { await page?.screenshot({ path: path.join(OUT, 'fail.png') }) } catch {}
  process.exit(1)
})
