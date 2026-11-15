import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { missions, repairNames } from '../src/game/listening/songs'
import voiceManifest from '../src/game/voice-manifest.json' with { type: 'json' }
import { chapters } from '../src/game/story'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    if (!localStorage.getItem('cadence-experience'))
      localStorage.setItem(
        'cadence-experience',
        JSON.stringify({ narration: false, motion: false }),
      )
    const original = AudioContext.prototype.createAnalyser
    AudioContext.prototype.createAnalyser = function () {
      const analyser = original.call(this)
      Object.assign(window, { listeningTestAnalyser: analyser })
      return analyser
    }
  })
})
async function open(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Begin your journey', exact: true }).click()
  await page.getByRole('button', { name: 'Skip scene', exact: true }).click()
  await page.getByRole('button', { name: 'Take a song apart', exact: true }).click()
  await page.getByRole('button', { name: 'Skip scene', exact: true }).click()
}
async function heard(page: Page, name: string | RegExp) {
  const button = page.getByRole('button', { name, exact: typeof name === 'string' })
  await button.click()
  await expect(button.locator('svg.lucide-check')).toBeVisible({ timeout: 12000 })
}
async function next(page: Page) {
  await page.getByRole('button', { name: 'Next listening mission', exact: true }).click()
}
async function saved(page: Page) {
  await expect(page.locator('.mission-understood')).toContainText('MISSION UNDERSTOOD')
}
async function signal(page: Page) {
  return page.evaluate(() => {
    const analyser = (window as unknown as { listeningTestAnalyser?: AnalyserNode })
      .listeningTestAnalyser
    if (!analyser || analyser.context.state === 'closed') return 0
    const data = new Float32Array(analyser.fftSize)
    analyser.getFloatTimeDomainData(data)
    return Math.max(...data.map(Math.abs))
  })
}

test('a whole record is heard, dissected, mapped, repaired, and improved with persistent rewards', async ({
  page,
}) => {
  test.setTimeout(180000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await open(page)
  await expect(
    page.getByRole('button', { name: 'Take apart A Familiar Star', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Take apart First Light', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Mission 2: Find the players', exact: true }),
  ).toBeDisabled()
  await page
    .getByRole('combobox', { name: 'Song playback speed', exact: true })
    .selectOption('1.25')
  await page.getByRole('button', { name: 'Peaceful', exact: true }).click()
  const begin = page.getByRole('button', { name: 'Start taking it apart', exact: true })
  await expect(begin).toBeDisabled()
  await page.getByRole('button', { name: 'Hear the complete record', exact: true }).click()
  await expect.poll(() => signal(page)).toBeGreaterThan(0.01)
  await expect(page.locator('.listening-checkpoint')).toContainText(
    'You’ve heard the whole piece.',
    { timeout: 45000 },
  )
  await begin.click()
  await saved(page)
  await next(page)

  for (const [index, role] of ['Bass', 'Melody', 'Drums', 'Chords'].entries()) {
    await page.getByRole('button', { name: new RegExp('Hear player ' + (index + 1)) }).click()
    const answer = page
      .getByRole('button', { name: new RegExp('^' + role + ' ') })
      .filter({ has: page.locator('small') })
    await expect(answer).toBeEnabled()
    if (index === 0) {
      await page.getByRole('button', { name: /^Melody The tune$/ }).click()
      await expect(page.locator('.listening-feedback')).toContainText('low foundation')
    }
    await answer.click()
    await page
      .getByRole('button', {
        name: index === 3 ? 'Players identified' : 'Next player',
        exact: true,
      })
      .click()
  }
  await saved(page)
  await next(page)
  await expect(page.getByRole('button', { name: 'Bass', exact: true })).toBeDisabled()
  await heard(page, 'A · The full band')
  await heard(page, 'B · Something missing')
  await page.getByRole('button', { name: 'Bass', exact: true }).click()
  await saved(page)
  await next(page)

  for (const name of [/01 · A little space/, /02 · The whole room/, /03 · Another color/])
    await heard(page, name)
  await page.getByRole('button', { name: 'Restless', exact: true }).click()
  await page.getByRole('button', { name: 'Keep my listening note', exact: true }).click()
  await saved(page)
  await next(page)
  for (const [index, name] of ['Intro', 'Verse', 'Chorus', 'Verse', 'Chorus', 'Outro'].entries()) {
    await heard(page, 'Audition passage ' + (index + 1))
    await page
      .getByRole('combobox', { name: 'Label passage ' + (index + 1), exact: true })
      .selectOption(index === 1 ? 'Chorus' : name)
  }
  await page.getByRole('button', { name: 'Check my song map', exact: true }).click()
  await expect(page.locator('.listening-feedback')).toContainText('same label')
  await page.getByRole('combobox', { name: 'Label passage 2', exact: true }).selectOption('Verse')
  await page.getByRole('button', { name: 'Check my song map', exact: true }).click()
  await saved(page)
  await next(page)

  await heard(page, /Remember home/)
  await heard(page, 'Ending A')
  await heard(page, 'Ending B')
  await page.getByRole('button', { name: 'Ending B returns home', exact: true }).click()
  await saved(page)
  await next(page)

  for (const [index, type] of (['pitch', 'timing', 'missing'] as const).entries()) {
    await heard(page, 'Reference')
    await heard(page, 'The player’s take')
    await page.getByRole('button', { name: repairNames[type], exact: true }).click()
    await page.getByRole('button', { name: 'Bar ' + (index + 4), exact: true }).click()
    await page.getByRole('button', { name: 'Check the performance', exact: true }).click()
    await expect(page.locator('.listening-feedback')).toHaveClass(/correct/)
    await page
      .getByRole('button', {
        name: index === 2 ? 'Performance repaired' : 'Next performance',
        exact: true,
      })
      .click()
  }
  await saved(page)
  await next(page)

  await heard(page, 'Before · buried tune')
  await heard(page, 'After · your balance')
  await page.getByRole('button', { name: 'Compare & finish my record', exact: true }).click()
  await expect(page.locator('.listening-feedback')).toContainText('Bring the melody forward')
  for (const [layer, value] of [
    ['Melody', '85'],
    ['Chords', '40'],
    ['Bass', '55'],
    ['Drums', '35'],
  ]) {
    await page.getByRole('slider', { name: layer + ' level', exact: true }).fill(value)
  }
  await expect(
    page.getByRole('button', { name: 'Compare & finish my record', exact: true }),
  ).toBeDisabled()
  await heard(page, 'After · your balance')
  await page.getByRole('button', { name: 'Compare & finish my record', exact: true }).click()
  await saved(page)
  await page.getByRole('button', { name: 'Hear what I understand', exact: true }).click()
  await expect(page.locator('.listening-summary')).toContainText('The verse stays lower')
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cadence-progress-v1')!).xp))
    .toBe(100)
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('cadence-listening-v1')!).cleared['first-light'],
    ),
  ).toHaveLength(missions.length)
  await page.reload()
  await page.getByRole('button', { name: 'Take a song apart', exact: true }).click()
  await page.getByRole('button', { name: 'Continue First Light', exact: true }).click()
  await expect(page.locator('.listening-summary')).toBeVisible()
  await expect(page.getByRole('slider', { name: 'Melody level', exact: true })).toHaveValue('85')
  await page.getByRole('slider', { name: 'Melody level', exact: true }).fill('80')
  await page.getByRole('button', { name: 'Save this mix', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Your mix is saved', exact: true })).toBeVisible()
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('cadence-progress-v1')!).xp),
  ).toBe(100)
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('cadence-listening-v1')!).mixes['first-light'].melody,
    ),
  ).toBe(0.8)
  expect(errors).toEqual([])
})

test('the waltz has three audible beats and live faders, pause, and game mute work', async ({
  page,
}) => {
  await open(page)
  await page.getByRole('button', { name: 'Take apart Lantern Waltz', exact: true }).click()
  await page.getByRole('button', { name: 'Play complete song', exact: true }).click()
  await expect.poll(() => signal(page)).toBeGreaterThan(0.01)
  await expect(page.locator('.listening-beat-counter>i')).toHaveCount(3)
  const before = await page.locator('.deck-position').textContent()
  await page.getByRole('button', { name: 'Pause song', exact: true }).click()
  await page.waitForTimeout(250)
  expect(await page.locator('.deck-position').textContent()).toBe(before)
  await expect.poll(() => signal(page)).toBeLessThan(0.001)
  await page.getByRole('button', { name: 'Resume song', exact: true }).click()
  await expect.poll(() => signal(page)).toBeGreaterThan(0.01)
  for (const layer of ['Melody', 'Chords', 'Bass', 'Drums'])
    await page.getByRole('slider', { name: layer + ' level', exact: true }).fill('0')
  await expect.poll(() => signal(page)).toBeLessThan(0.001)
  await page.getByRole('button', { name: 'Restore the original balance', exact: true }).click()
  await expect.poll(() => signal(page)).toBeGreaterThan(0.01)
  await page.locator('.deck-now-playing').click()
  await page.keyboard.press('m')
  await expect.poll(() => signal(page)).toBeLessThan(0.001)
  await page.keyboard.press('m')
  await expect.poll(() => signal(page)).toBeGreaterThan(0.01)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Inside a song', exact: true })).toHaveCount(0)
  await expect.poll(() => signal(page)).toBeLessThan(0.001)
})

test('Act II remains reachable after the ending and small screens have focused player and mission views', async ({
  page,
}) => {
  await page.addInitScript(
    (ids) => {
      localStorage.setItem(
        'cadence-story-v1',
        JSON.stringify({
          version: 1,
          started: true,
          finale: true,
          cleared: ids,
          discovered: [],
          curiosities: [],
        }),
      )
    },
    chapters.map((chapter) => chapter.id),
  )
  await page.goto('/')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Take a song apart', exact: true }).first().click()
  await page.getByRole('button', { name: 'Skip scene', exact: true }).click()
  await page.getByRole('button', { name: 'Take apart First Light', exact: true }).click()
  for (const [width, height] of [
    [390, 844],
    [360, 740],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height })
    const tabs = page.getByRole('group', { name: 'Listening room view', exact: true })
    if (width <= 850) {
      await tabs.getByRole('button', { name: 'The mission', exact: true }).click()
      await expect(
        page.getByRole('heading', { name: 'Meet the whole song', exact: true }),
      ).toBeVisible()
      await expect(
        page.getByRole('slider', { name: 'Melody level', exact: true }),
      ).not.toBeVisible()
      await tabs.getByRole('button', { name: 'Player & faders', exact: true }).click()
      await expect(page.getByRole('slider', { name: 'Melody level', exact: true })).toBeVisible()
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const room = await page
      .getByRole('dialog', { name: 'Inside a song', exact: true })
      .boundingBox()
    expect(room!.x + room!.width).toBeLessThanOrEqual(width)
  }
})

test('a new record and all its spoken guides work after an offline reload', async ({
  page,
  context,
}) => {
  await open(page)
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  const cached = await page.evaluate(async () => {
    const requests = (
      await Promise.all(
        (await caches.keys()).map(async (name) =>
          (await (await caches.open(name)).keys()).map((request) => request.url),
        ),
      )
    ).flat()
    return new Set(requests.filter((url) => url.includes('/game/voices/') && url.includes('.mp3')))
      .size
  })
  expect(cached).toBe(Object.keys(voiceManifest.lines).length)
  await context.setOffline(true)
  await page.reload()
  await page.getByRole('button', { name: 'Take a song apart', exact: true }).click()
  await page.getByRole('button', { name: 'Take apart A Familiar Star', exact: true }).click()
  await page.getByRole('button', { name: 'Play complete song', exact: true }).click()
  await expect.poll(() => signal(page)).toBeGreaterThan(0.01)
  await page.getByRole('button', { name: 'Enable spoken guides', exact: true }).click()
  await expect
    .poll(() =>
      page
        .locator('audio[data-story-voice]')
        .evaluate((el: HTMLAudioElement) => !el.paused && el.currentTime > 0.2),
    )
    .toBe(true)
})
