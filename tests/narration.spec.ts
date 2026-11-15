import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const voiceSelector = 'audio[data-story-voice]'
const voice = (page: Page) => page.locator(voiceSelector)

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  // Chromium on many platforms has no system TTS voices. The bundled cast must still speak.
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true })
  })
})

async function begin(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Begin your journey', exact: true }).click()
}
async function speaking(page: Page, speaker = 'iona') {
  await expect(voice(page)).toHaveAttribute('data-speaker', speaker)
  await expect
    .poll(() =>
      voice(page).evaluate(
        (element: HTMLAudioElement) =>
          !element.paused && element.readyState >= 3 && element.currentTime > 0.15,
      ),
    )
    .toBe(true)
}

test('real voiced dialogue plays, pauses, resumes, and cancels when a scene is skipped', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await begin(page)
  await speaking(page)
  await expect(page.locator('.story-dialogue')).toHaveClass(/is-speaking/)
  // Measure decoded audio, so a play event or a silent placeholder cannot pass this check.
  const peak = await voice(page).evaluate(async (element: HTMLAudioElement) => {
    const context = new AudioContext()
    await context.resume()
    const source = context.createMediaElementSource(element)
    const analyser = context.createAnalyser()
    source.connect(analyser)
    analyser.connect(context.destination)
    const data = new Float32Array(analyser.fftSize)
    let peak = 0
    for (let i = 0; i < 12; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      analyser.getFloatTimeDomainData(data)
      peak = Math.max(peak, ...data.map(Math.abs))
    }
    return peak
  })
  expect(peak).toBeGreaterThan(0.01)

  await page.getByRole('button', { name: 'Pause voice', exact: true }).click()
  const pausedAt = await voice(page).evaluate((element: HTMLAudioElement) => element.currentTime)
  await page.waitForTimeout(350)
  expect(
    await voice(page).evaluate((element: HTMLAudioElement) => element.currentTime),
  ).toBeCloseTo(pausedAt, 1)
  await expect(page.getByRole('button', { name: 'Resume voice', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Resume voice', exact: true }).click()
  await speaking(page)
  await expect
    .poll(() => voice(page).evaluate((element: HTMLAudioElement) => element.currentTime))
    .toBeGreaterThan(pausedAt + 0.15)

  // An OS/media interruption should also update the visible playback controls.
  await voice(page).evaluate((element: HTMLAudioElement) => element.pause())
  await page.getByRole('button', { name: 'Resume voice', exact: true }).click()
  await speaking(page)

  await page.getByRole('button', { name: 'Replay voice', exact: true }).click()
  expect(
    await voice(page).evaluate((element: HTMLAudioElement) => element.currentTime),
  ).toBeLessThan(0.7)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.locator('.dialogue-text')).toContainText('Then the Great Resonator fell silent')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await speaking(page, 'keeper')
  expect(await voice(page).count()).toBe(1)
  await page.getByRole('button', { name: 'Skip scene', exact: true }).click()
  expect(
    await voice(page).evaluate(
      (element: HTMLAudioElement) => element.paused && !element.getAttribute('src'),
    ),
  ).toBe(true)
  await page.waitForTimeout(750)
  await expect(page.locator('.story-dialogue')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('the spoken conversation advances naturally and always waits at a player choice', async ({
  page,
}) => {
  test.setTimeout(40000)
  await page.addInitScript(() =>
    localStorage.setItem('cadence-experience', JSON.stringify({ voiceRate: 1.5 })),
  )
  await begin(page)
  await speaking(page)
  await expect(page.locator('.dialogue-text')).toContainText(
    'Then the Great Resonator fell silent',
    { timeout: 12000 },
  )
  await expect(voice(page)).toHaveJSProperty('playbackRate', 1.5)
  await expect(
    page.getByRole('button', { name: 'What if I play a wrong note?', exact: true }),
  ).toBeVisible({ timeout: 20000 })
  await page.waitForTimeout(900)
  await expect(
    page.getByRole('button', { name: 'I’ll follow the Echoes.', exact: true }),
  ).toBeVisible()
  expect(await voice(page).evaluate((element: HTMLAudioElement) => element.ended)).toBe(true)
  await page.getByRole('button', { name: 'What if I play a wrong note?', exact: true }).click()
  await expect(page.locator('.dialogue-text')).toContainText(
    'Wrong notes are just places to listen again',
  )
  await speaking(page, 'pip')
  await page.keyboard.press('Escape')
  expect(
    await voice(page).evaluate(
      (element: HTMLAudioElement) => element.paused && !element.getAttribute('src'),
    ),
  ).toBe(true)
})

test('voice settings and manual progression persist, and game mute silences characters', async ({
  page,
}) => {
  await begin(page)
  await speaking(page)
  await page.getByRole('button', { name: 'Dialogue voice options', exact: true }).click()
  await page.getByRole('slider', { name: 'Dialogue voice volume', exact: true }).fill('40')
  await page
    .getByRole('combobox', { name: 'Dialogue speaking pace', exact: true })
    .selectOption('1.25')
  await page.getByRole('button', { name: 'Auto-advance dialogue', exact: true }).click()
  await expect(voice(page)).toHaveJSProperty('volume', 0.4)
  await expect(voice(page)).toHaveJSProperty('playbackRate', 1.25)
  await page.locator('.dialogue-text').click()
  await page.keyboard.press('m')
  await expect(page.getByRole('button', { name: 'Unmute dialogue', exact: true })).toBeVisible()
  await expect(voice(page)).toHaveJSProperty('paused', true)
  await page.getByRole('button', { name: 'Unmute dialogue', exact: true }).click()
  await speaking(page)
  await page.getByRole('button', { name: 'Character voices', exact: true }).click()
  await expect(voice(page)).toHaveJSProperty('paused', true)
  await expect(page.locator('.voice-status')).toHaveText('Captions only')
  await page.reload()
  await page.getByRole('button', { name: 'Begin your journey', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Auto-advance dialogue', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.voice-status')).toHaveText('Captions only')
  await page.getByRole('button', { name: 'Dialogue voice options', exact: true }).click()
  await expect(
    page.getByRole('slider', { name: 'Dialogue voice volume', exact: true }),
  ).toHaveValue('40')
  await expect(
    page.getByRole('combobox', { name: 'Dialogue speaking pace', exact: true }),
  ).toHaveValue('1.25')
  await page.getByRole('button', { name: 'Enable character voices', exact: true }).click()
  await speaking(page)
  await page.getByRole('button', { name: 'Dialogue voice options', exact: true }).click()
  // Let the real voice finish; manual mode must leave its caption on screen.
  await expect
    .poll(() => voice(page).evaluate((element: HTMLAudioElement) => element.ended), {
      timeout: 10000,
    })
    .toBe(true)
  await page.waitForTimeout(1000)
  await expect(page.locator('.dialogue-text')).toContainText('Thousands of living voices')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await speaking(page)
  await expect(page.locator('.dialogue-text')).toContainText('Then the Great Resonator fell silent')
})

test('blocked autoplay offers a working play button and keeps the whole caption visible', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play
    let blocked = false
    HTMLMediaElement.prototype.play = function () {
      if (!blocked && this.src.includes('/game/voices/')) {
        blocked = true
        return Promise.reject(new DOMException('Gesture required', 'NotAllowedError'))
      }
      return original.call(this)
    }
  })
  await begin(page)
  await expect(page.locator('.voice-status')).toHaveText('Press play to hear the character.')
  await expect(page.locator('.dialogue-visible-text')).toContainText('Thousands of living voices.')
  await page.getByRole('button', { name: 'Play voice', exact: true }).click()
  await speaking(page)
})

test.describe('voice recovery', () => {
  test.use({ serviceWorkers: 'block' })
  test('a failed voice download keeps captions playable and can be retried', async ({ page }) => {
    await page.route('**/game/voices/*.mp3', (route) => route.abort('failed'))
    await begin(page)
    await expect(page.locator('.voice-status')).toHaveText(
      'Voice couldn’t load. Retry, or follow the captions.',
    )
    await expect(page.locator('.dialogue-visible-text')).toContainText(
      'Thousands of living voices.',
    )
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.locator('.dialogue-text')).toContainText(
      'Then the Great Resonator fell silent',
    )
    await expect(page.getByRole('button', { name: 'Retry voice', exact: true })).toBeVisible()
    await page.unroute('**/game/voices/*.mp3')
    await page.getByRole('button', { name: 'Retry voice', exact: true }).click()
    await speaking(page)
  })
})

test('every voice is cached and an unheard chapter speaks after an offline reload', async ({
  page,
  context,
}) => {
  await begin(page)
  await page.getByRole('button', { name: 'Skip scene', exact: true }).click()
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  const cachedVoices = await page.evaluate(async () => {
    const names = await caches.keys()
    const all = await Promise.all(
      names.map(async (name) =>
        (await (await caches.open(name)).keys()).map((request) => request.url),
      ),
    )
    return new Set(
      all.flat().filter((url) => url.includes('/game/voices/') && url.includes('.mp3')),
    ).size
  })
  expect(cachedVoices).toBe(46)
  await context.setOffline(true)
  await page.reload()
  await page.getByRole('button', { name: 'Enter chapter', exact: true }).click()
  await speaking(page, 'pip')
  await expect(page.locator('.dialogue-text')).toContainText('silence hasn’t taken everything')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await speaking(page, 'memory')
})

test('voice controls and captions remain reachable on small and landscape phones', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await begin(page)
  await page.getByRole('button', { name: 'Pause voice', exact: true }).click()
  for (const [width, height] of [
    [390, 844],
    [360, 740],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height })
    await page.getByRole('button', { name: 'Dialogue voice options', exact: true }).click()
    await page
      .getByRole('combobox', { name: 'Dialogue speaking pace', exact: true })
      .selectOption('0.75')
    await page.getByRole('button', { name: 'Dialogue voice options', exact: true }).click()
    const next = page.getByRole('button', { name: 'Continue', exact: true })
    await next.scrollIntoViewIfNeeded()
    await expect(next).toBeInViewport()
    await page.getByRole('button', { name: 'Resume voice', exact: true }).scrollIntoViewIfNeeded()
    await expect(page.getByRole('button', { name: 'Resume voice', exact: true })).toBeInViewport()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})
