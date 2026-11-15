import { expect, test } from '@playwright/test'

const errors: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', (error) => errors.push(error.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
})
test.afterEach(() => expect(errors).toEqual([]))

test('the journey is responsive, all quests are reachable, and navigation works', async ({
  page,
}) => {
  await page.goto('/?mode=practice')
  await expect(page.getByRole('heading', { name: 'Let’s find your rhythm.' })).toBeVisible()
  await expect(page.locator('.quest-card')).toHaveCount(3)
  await page.getByRole('button', { name: 'Harmony', exact: true }).click()
  await expect(page.locator('.quest-card')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Better together' })).toBeVisible()
  await page.getByRole('button', { name: 'Melody', exact: true }).click()
  await expect(page.locator('.quest-card')).toHaveCount(3)
  for (const width of [1440, 1024, 820, 650, 390, 360]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    for (const card of await page.locator('.quest-card').all()) await expect(card).toBeVisible()
    expect(
      await page.locator('.quest-card').evaluateAll((cards) =>
        cards.every((card) => {
          const outer = card.getBoundingClientRect()
          const copy = card.querySelector('.quest-card-copy')!.getBoundingClientRect()
          return copy.bottom <= outer.bottom + 1 && copy.right <= outer.right + 1
        }),
      ),
    ).toBe(true)
  }
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('button', { name: /Playground/ }).click()
  await expect(page.getByRole('heading', { name: 'Make a little noise.' })).toBeVisible()
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('button', { name: 'Music basics' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Harmony', exact: true }).click()
  await expect(dialog.getByRole('heading', { name: 'When notes become a team.' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
})

test('a complete notes quest grades answers, rewards XP, and keeps progress after reload', async ({
  page,
}) => {
  await page.goto('/?mode=practice')
  await page.locator('.quest-card').filter({ hasText: 'Meet the notes' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Let’s play' }).click()
  for (const [i, name] of ['C5', 'E4', 'G4', 'D4', 'F4'].entries()) {
    await dialog.getByRole('button', { name: `Play ${name}`, exact: true }).click()
    await expect(dialog.getByRole('status')).toContainText('That’s music to our ears!')
    await dialog
      .getByRole('button', { name: i === 4 ? 'See results' : 'Next', exact: true })
      .click()
  }
  await expect(dialog).toContainText('5/5')
  await expect(dialog).toContainText('+50')
  await dialog.getByRole('button', { name: 'Keep exploring' }).click()
  await expect(page.locator('.journey-count')).toHaveText('1 of 6 explored')
  await page.reload()
  await expect(page.locator('.journey-count')).toHaveText('1 of 6 explored')
  await page.getByRole('button', { name: 'My progress', exact: true }).click()
  await expect(page.locator('.progress-summary')).toContainText('50')
  await expect(page.locator('.badge-card.unlocked')).toHaveCount(2)
})

test('ear training explains an incorrect answer and only gives the daily bonus once', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.9
  })
  await page.goto('/?mode=practice')
  for (let attempt = 0; attempt < 2; attempt++) {
    await page
      .getByRole('button', { name: attempt === 0 ? 'Give it a go' : 'Play it again', exact: true })
      .click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Let’s play' }).click()
    for (let round = 0; round < 3; round++) {
      await expect(dialog.getByRole('button', { name: 'Higher', exact: true })).toBeDisabled()
      await dialog.getByRole('button', { name: 'Play the sounds', exact: true }).click()
      await expect(dialog.getByRole('button', { name: 'Higher', exact: true })).toBeEnabled()
      await dialog
        .getByRole('button', {
          name: attempt === 0 && round === 0 ? 'Lower' : 'Higher',
          exact: true,
        })
        .click()
      if (attempt === 0 && round === 0) {
        await expect(dialog.getByRole('status')).toContainText('The second note was higher.')
        await expect(dialog.getByRole('status')).toContainText('A little discovery for next time.')
      }
      await dialog
        .getByRole('button', { name: round === 2 ? 'See results' : 'Next', exact: true })
        .click()
    }
    await expect(dialog).toContainText(attempt === 0 ? '+70' : '+50')
    await dialog.getByRole('button', { name: 'Keep exploring' }).click()
  }
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('cadence-progress-v1')!).xp),
  ).toBe(120)
})

test('the piano records, replays, and saves ideas; beats are editable and persist', async ({
  page,
}) => {
  await page.goto('/?mode=practice')
  await page.getByRole('button', { name: /Playground/ }).click()
  await page.getByRole('button', { name: 'Record', exact: true }).click()
  await page.keyboard.press('a')
  await page.keyboard.press('d')
  await page.keyboard.press('g')
  await page.getByRole('button', { name: 'Stop', exact: true }).click()
  await page.getByRole('button', { name: 'Replay', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Replay', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Save idea', exact: true }).click()
  await expect(page.locator('.ideas-list')).toContainText('3 notes')
  await page.getByRole('button', { name: 'Beat maker', exact: true }).click()
  const step = page.getByRole('button', { name: 'Kick step 2', exact: true })
  await expect(step).toHaveAttribute('aria-pressed', 'false')
  await step.click()
  await expect(step).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('slider', { name: 'Beat tempo' }).fill('125')
  await expect(page.locator('.tempo-control')).toContainText('125 BPM')
  await page.getByRole('button', { name: 'Play beat', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pause beat', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Save beat', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: /Playground/ }).click()
  await expect(page.locator('.ideas-list')).toContainText('3 notes')
  await page.getByRole('button', { name: 'Beat maker', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Kick step 2', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('a rhythm quest accepts timed taps through all three rounds', async ({ page }) => {
  await page.goto('/?mode=practice')
  await page.getByRole('button', { name: 'Start my journey' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Let’s play' }).click()
  for (const [round, bpm] of [80, 96, 108].entries()) {
    await dialog.getByRole('button', { name: 'Start the beat', exact: true }).click()
    await page.waitForFunction(
      () => document.querySelector('.rhythm-message')?.textContent?.includes('Your turn!'),
      undefined,
      { polling: 'raf', timeout: 6000 },
    )
    for (let beat = 0; beat < 4; beat++) {
      await page.keyboard.press('Space')
      if (beat < 3) await page.waitForTimeout(60000 / bpm - 15)
    }
    await expect(dialog.getByRole('status')).toContainText('4 of 4 beats in time.')
    await dialog
      .getByRole('button', { name: round === 2 ? 'See results' : 'Next', exact: true })
      .click()
  }
  await expect(dialog).toContainText('3/3')
})

test('the production PWA reloads and remains playable fully offline', async ({ page, context }) => {
  await page.goto('/?mode=practice')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  await expect(page.locator('.sidebar-footer')).toContainText('Ready for offline adventures')
  const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute('href')
  const manifestResponse = await page.request.get(manifestUrl!)
  const manifest = await manifestResponse.json()
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons).toHaveLength(2)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Let’s find your rhythm.' })).toBeVisible()
  await expect(page.locator('.sidebar-footer')).toContainText('Offline & still in tune')
  await page.locator('.quest-card').filter({ hasText: 'Meet the notes' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Let’s play' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Play C4', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('That’s music to our ears!')
})

test('melody memory, minor chord listening, and tempo comparison complete their learning loops', async ({
  page,
}) => {
  test.setTimeout(90000)
  await page.addInitScript(() => {
    Math.random = () => 0.1
  })
  await page.goto('/?mode=practice')
  await page.getByRole('button', { name: 'Explore all 6 quests' }).click()
  await page.locator('.quest-card').filter({ hasText: 'Melody maker' }).click()
  let dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Let’s play' }).click()
  for (const [round, keys] of [
    ['a', 'd', 'g'],
    ['g', 'd', 'a'],
    ['a', 's', 'd', 'a'],
  ].entries()) {
    await dialog.getByRole('button', { name: 'Play the melody', exact: true }).click()
    await expect(dialog.getByRole('button', { name: 'Listen again', exact: true })).toBeEnabled()
    for (const key of keys) await page.keyboard.press(key)
    await expect(dialog.getByRole('status')).toContainText('That’s music to our ears!')
    await dialog
      .getByRole('button', { name: round === 2 ? 'See results' : 'Next', exact: true })
      .click()
  }
  await expect(dialog).toContainText('3/3')
  await dialog.getByRole('button', { name: 'Keep exploring' }).click()
  await page.locator('.quest-card').filter({ hasText: 'Better together' }).click()
  dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Major example' }).click()
  await dialog.getByRole('button', { name: 'Minor example' }).click()
  await dialog.getByRole('button', { name: 'Let’s play' }).click()
  for (let round = 0; round < 5; round++) {
    await dialog.getByRole('button', { name: 'Play the chord', exact: true }).click()
    await expect(dialog.getByRole('button', { name: /Minor/ })).toBeEnabled()
    await dialog.getByRole('button', { name: /Minor/ }).click()
    await expect(dialog.getByRole('status')).toContainText('That was a minor triad.')
    await dialog
      .getByRole('button', { name: round === 4 ? 'See results' : 'Next', exact: true })
      .click()
  }
  await expect(dialog).toContainText('5/5')
  await dialog.getByRole('button', { name: 'Keep exploring' }).click()
  await page.locator('.quest-card').filter({ hasText: 'Change the pace' }).click()
  dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Let’s play' }).click()
  for (let round = 0; round < 4; round++) {
    await dialog.getByRole('button', { name: 'Play the sounds', exact: true }).click()
    await expect(dialog.getByRole('button', { name: 'Slower', exact: true })).toBeEnabled({
      timeout: 12000,
    })
    await dialog.getByRole('button', { name: 'Slower', exact: true }).click()
    await expect(dialog.getByRole('status')).toContainText('The second beat was slower:')
    await dialog
      .getByRole('button', { name: round === 3 ? 'See results' : 'Next', exact: true })
      .click()
  }
  await expect(dialog).toContainText('4/4')
  await dialog.getByRole('button', { name: 'Keep exploring' }).click()
  await expect(page.locator('.journey-count')).toContainText('3 of 6 explored')
})

test('theme and motion preferences persist, and the adventure map opens focused quests', async ({
  page,
}) => {
  await page.goto('/?mode=practice')
  await page.getByRole('button', { name: 'Switch to after hours' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Experience settings' }).click()
  const preferences = page.getByRole('dialog', { name: 'Your experience' })
  await expect(preferences.getByRole('button', { name: 'After hours' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  const motion = preferences.getByRole('switch', { name: 'Gentle motion', exact: true })
  await expect(motion).toHaveAttribute('aria-checked', 'false')
  await motion.click()
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'full')
  await motion.click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Adventure map', exact: true }).click()
  await expect(page.locator('.map-stops > li')).toHaveCount(6)
  await page.getByRole('button', { name: 'Start Highs & lows', exact: true }).click()
  const quest = page.getByRole('dialog')
  await expect(quest).toHaveClass(/quest-focus/)
  await quest.getByRole('button', { name: 'Exit quest focus' }).click()
  await expect(quest).not.toHaveClass(/quest-focus/)
  await quest.getByRole('button', { name: 'Focus on this quest' }).click()
  await expect(quest).toHaveClass(/quest-focus/)
  await page.keyboard.press('Escape')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced')
  await expect(page.getByRole('button', { name: 'Adventure map', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  for (const width of [1024, 820, 390, 360]) {
    await page.setViewportSize({ width, height: 844 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(
      page.getByRole('button', { name: 'Start Change the pace', exact: true }),
    ).toBeVisible()
  }
})

test('soundscape produces audio, mixes layers, and restores a saved mood', async ({ page }) => {
  await page.addInitScript(() => {
    const original = AudioContext.prototype.createAnalyser
    AudioContext.prototype.createAnalyser = function () {
      const analyser = original.call(this)
      Object.assign(window, { cadenceTestAnalyser: analyser })
      return analyser
    }
  })
  await page.goto('/?mode=practice')
  await page.getByRole('button', { name: 'Enter the flow' }).click()
  await expect(page.locator('.soundscape-title')).toContainText('Golden hour')
  await page.getByRole('button', { name: 'Start the room', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pause the room', exact: true })).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => {
        const analyser = (window as unknown as { cadenceTestAnalyser?: AnalyserNode })
          .cadenceTestAnalyser
        if (!analyser) return false
        const signal = new Uint8Array(analyser.fftSize)
        analyser.getByteTimeDomainData(signal)
        return signal.some((value) => Math.abs(value - 128) > 3)
      }),
    )
    .toBe(true)
  await page.getByRole('button', { name: /Moon garden/ }).click()
  await expect(page.locator('.universe-center')).toContainText('A minor')
  await page.getByRole('slider', { name: 'Soundscape tempo' }).fill('93')
  await page.getByRole('slider', { name: 'The atmosphere level' }).fill('45')
  await page.getByRole('button', { name: 'Mute the heartbeat', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Enable the heartbeat', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false')
  await page.getByRole('button', { name: 'Save this feeling', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Your feeling is saved', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Pause the room', exact: true }).click()
  await page.getByRole('button', { name: 'Piano room', exact: true }).click()
  await page.getByRole('button', { name: 'Enter the flow' }).click()
  await expect(page.locator('.soundscape-title')).toContainText('Moon garden')
  await page.reload()
  await page.getByRole('button', { name: 'Enter the flow' }).click()
  await expect(page.locator('.soundscape-title')).toContainText('Moon garden')
  await expect(page.getByRole('slider', { name: 'Soundscape tempo' })).toHaveValue('93')
  await expect(page.getByRole('slider', { name: 'The atmosphere level' })).toHaveValue('45')
  await expect(
    page.getByRole('button', { name: 'Enable the heartbeat', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start the room', exact: true })).toBeVisible()
})

test('the soundscape focus room works on mobile, traps focus, and exits with Escape', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?mode=practice')
  await page.getByRole('button', { name: 'Or, get lost in the sound' }).click()
  await page.getByRole('button', { name: 'Focus on the soundscape' }).click()
  const room = page.getByRole('dialog', { name: 'Soundscape focus room' })
  await expect(room).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(room.getByRole('button', { name: 'Soundscape guide' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(room.getByRole('button', { name: 'Save this feeling', exact: true })).toBeFocused()
  await page.keyboard.press('a')
  await expect(page.locator('.melody-pad.active')).toHaveCount(1)
  for (const width of [390, 360, 820]) {
    await page.setViewportSize({ width, height: 844 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(room).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Focus on the soundscape' })).toBeVisible()
})

test('the new soundscape remains an instrument after an offline reload', async ({
  page,
  context,
}) => {
  await page.goto('/?mode=practice')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  await context.setOffline(true)
  await page.reload()
  await page.getByRole('button', { name: 'Enter the flow' }).click()
  await page.getByRole('button', { name: /Wildflower/ }).click()
  await page.getByRole('button', { name: 'Start the room', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pause the room', exact: true })).toBeVisible()
  await expect(page.locator('.soundscape-title')).toContainText('Wildflower')
  await page.getByRole('button', { name: 'Play soundscape F4', exact: true }).click()
  await expect(page.locator('.melody-pad.active')).toHaveCount(1)
})
