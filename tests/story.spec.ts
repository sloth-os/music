import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const errors: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', (error) => errors.push(error.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
})
test.afterEach(() => expect(errors).toEqual([]))
async function begin(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Begin your journey', exact: true }).click()
  await page.getByRole('button', { name: 'Skip scene', exact: true }).click()
}
async function enter(page: Page) {
  await page.getByRole('button', { name: 'Enter chapter', exact: true }).click()
  await page.getByRole('button', { name: 'Skip scene', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Let’s play', exact: true }).click()
}
async function finishRound(page: Page, last: boolean) {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: last ? 'See results' : 'Next', exact: true })
    .click()
}
async function recover(page: Page) {
  await page.getByRole('button', { name: 'Claim the Echo', exact: true }).click()
  await page.getByRole('button', { name: 'Skip scene', exact: true }).click()
  await expect(page.locator('.echo-reward')).toBeVisible()
  await page
    .getByRole('button', { name: /Follow the next Echo|Return for the final concert/ })
    .click()
}

test('the game opens as a world, tells its prologue, and preserves a player’s choice', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('.game-title-screen h1')).toContainText('Symphony')
  await expect(page.locator('.sidebar')).toHaveCount(0)
  expect(
    await page
      .locator('.world-painting')
      .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 1000),
  ).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true)
  await page.getByRole('button', { name: 'Begin your journey', exact: true }).click()
  await expect(page.locator('.dialogue-text')).toContainText('Thousands of living voices')
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Let’s begin', exact: true }).click()
  await page.getByRole('button', { name: 'What if I play a wrong note?', exact: true }).click()
  await expect(page.locator('.dialogue-text')).toContainText(
    'Wrong notes are just places to listen again',
  )
  await page.getByRole('button', { name: 'Let’s begin', exact: true }).click()
  await expect(page.locator('.main-quest-tracker')).toContainText('Recover the Echo of Pulse')
  await expect(page.getByRole('button', { name: /Clockwork Quarter, chapter IV/ })).toBeDisabled()
  await expect(page.locator('.chapter-dock')).toContainText('A heartbeat in the dark')
  await page.reload()
  await expect(page.locator('.game-title-screen')).toHaveCount(0)
  await expect(page.locator('.main-quest-tracker')).toContainText('Recover the Echo of Pulse')
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('cadence-story-v1')!).approach),
  ).toBe('curious')
})

test('all six historical chapters lead to a playable finale and a persistent ending', async ({
  page,
}) => {
  test.setTimeout(240000)
  await page.addInitScript(() => {
    Math.random = () => 0.9
  })
  await begin(page)
  const recovered: string[] = []
  for (let chapter = 0; chapter < 6; chapter++) {
    await enter(page)
    if (chapter === 0) {
      for (const [round, bpm] of [80, 96, 108].entries()) {
        await page.getByRole('button', { name: 'Start the beat', exact: true }).click()
        await page.waitForFunction(
          () => document.querySelector('.rhythm-message')?.textContent?.includes('Your turn!'),
          undefined,
          { polling: 'raf', timeout: 6000 },
        )
        for (let beat = 0; beat < 4; beat++) {
          await page.keyboard.press('Space')
          if (beat < 3) await page.waitForTimeout(60000 / bpm - 12)
        }
        await expect(page.getByRole('dialog').getByRole('status')).toContainText(
          '4 of 4 beats in time',
        )
        await finishRound(page, round === 2)
      }
    } else if (chapter === 1 || chapter === 4 || chapter === 5) {
      const rounds = chapter === 5 ? 4 : 5
      for (let round = 0; round < rounds; round++) {
        await page
          .getByRole('button', {
            name: chapter === 4 ? 'Play the chord' : 'Play the sounds',
            exact: true,
          })
          .click()
        const answer = page.getByRole('button', {
          name: chapter === 1 ? 'Higher' : chapter === 4 ? /Major/ : 'Faster',
          exact: chapter !== 4,
        })
        await expect(answer).toBeEnabled({ timeout: 12000 })
        await answer.click()
        await expect(page.getByRole('dialog').getByRole('status')).toContainText(
          'That’s music to our ears',
        )
        await finishRound(page, round === rounds - 1)
      }
    } else if (chapter === 2) {
      for (const [round, note] of ['C4', 'E4', 'G4', 'D4', 'F4'].entries()) {
        await page.getByRole('button', { name: `Play ${note}`, exact: true }).click()
        await finishRound(page, round === 4)
      }
    } else {
      for (const [round, keys] of [
        ['a', 'd', 'g'],
        ['g', 'd', 'a'],
        ['a', 's', 'd', 'a'],
      ].entries()) {
        await page.getByRole('button', { name: 'Play the melody', exact: true }).click()
        await expect(page.getByRole('button', { name: 'Listen again', exact: true })).toBeEnabled()
        for (const key of keys) await page.keyboard.press(key)
        await finishRound(page, round === 2)
      }
    }
    await recover(page)
    recovered.push(['Pulse', 'Voice', 'Symbol', 'Line', 'Color', 'Motion'][chapter])
    for (const echo of recovered)
      await expect(
        page.getByRole('button', { name: `${echo} Echo, recovered`, exact: true }),
      ).toBeVisible()
  }
  await expect(page.locator('.main-quest-tracker')).toContainText('Bring every voice home')
  await page.getByRole('button', { name: 'Play the finale', exact: true }).click()
  await page.getByRole('button', { name: 'Listen to the final melody', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Finale play C', exact: true })).toBeEnabled()
  for (const name of ['C', 'E', 'G', 'D'])
    await page.getByRole('button', { name: `Finale play ${name}`, exact: true }).click()
  await page.getByRole('button', { name: 'Begin the final heartbeat', exact: true }).click()
  await page.waitForFunction(
    () => document.querySelector('.finale-message')?.textContent?.includes('Your turn!'),
    undefined,
    { polling: 'raf', timeout: 6000 },
  )
  for (let beat = 0; beat < 4; beat++) {
    await page.keyboard.press('Space')
    if (beat < 3) await page.waitForTimeout(60000 / 90 - 12)
  }
  await expect(page.getByRole('button', { name: /A quiet wonder/ })).toBeVisible()
  await page.getByRole('button', { name: /A quiet wonder/ }).click()
  await expect(page.getByRole('button', { name: /A quiet wonder/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: 'Play the restored symphony', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Become a Keeper of Echoes', exact: true }),
  ).toBeEnabled({ timeout: 14000 })
  await page.getByRole('button', { name: 'Become a Keeper of Echoes', exact: true }).click()
  await expect(page.locator('.story-scene-header')).toContainText('A song that starts with you')
  await page.getByRole('button', { name: 'Skip scene', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Keeper of Echoes', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Explore the awakened world', exact: true }).click()
  await page.reload()
  await expect(page.locator('.game-root')).toHaveClass(/story-complete/)
  await expect(page.locator('.main-quest-tracker')).toContainText('Keeper of Echoes')
  await page.getByRole('button', { name: 'Open field journal', exact: true }).click()
  await page.getByRole('button', { name: /V. Brasswater Harbor/ }).click()
  await expect(page.locator('.journal-fact')).toContainText(
    'Black musicians and communities were central',
  )
  await expect(page.locator('.journal-source')).toHaveAttribute(
    'href',
    'https://www.nps.gov/jazz/learn/historyculture/history_early.htm',
  )
  await expect(page.locator('.journal-context')).toContainText(
    'adventure and its characters are fictional',
  )
  await page.getByRole('button', { name: 'Revisit the story', exact: true }).click()
  for (let line = 0; line < 5; line++)
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.locator('.dialogue-text')).toContainText('misunderstood the Hush')
  await page.getByRole('button', { name: 'Skip scene', exact: true }).click()
  await expect(
    page.getByRole('dialog', { name: 'Keeper’s field journal', exact: true }),
  ).toBeVisible()
})

test('a failed memory gives feedback and a retry while keeping the next chapter locked', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.9
    localStorage.setItem(
      'cadence-story-v1',
      JSON.stringify({
        version: 1,
        started: true,
        cleared: ['embers'],
        discovered: ['embers', 'marble'],
        curiosities: [],
        finale: false,
        approach: 'brave',
      }),
    )
  })
  await page.goto('/')
  await enter(page)
  for (let round = 0; round < 5; round++) {
    await page.getByRole('button', { name: 'Play the sounds', exact: true }).click()
    const answer = page.getByRole('button', { name: 'Lower', exact: true })
    await expect(answer).toBeEnabled()
    await answer.click()
    await finishRound(page, round === 4)
  }
  await expect(page.locator('.quest-result')).toContainText('Echo is still flickering')
  await page.getByRole('button', { name: 'Return to the island', exact: true }).click()
  await expect(page.getByRole('button', { name: /Lantern Abbey, chapter III/ })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
  await expect(page.locator('.main-quest-tracker')).toContainText('Recover the Echo of Voice')
  await enter(page)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Open field journal', exact: true })).toBeEnabled()
})

test('the island’s secrets are saved and reward curiosity only once', async ({ page }) => {
  await begin(page)
  for (const [index, name] of [
    'the wind chimes',
    'the abandoned score',
    'the firefly grove',
  ].entries()) {
    await page.getByRole('button', { name: `Explore ${name}`, exact: true }).click()
    await expect(page.locator('.curiosity-reward')).toContainText('+10 XP')
    await page.getByRole('button', { name: 'Keep exploring', exact: true }).click()
    await expect(page.locator('.game-xp')).toContainText(`${(index + 1) * 10}`)
  }
  await page.getByRole('button', { name: 'Explore the wind chimes', exact: true }).click()
  await expect(page.locator('.curiosity-reward')).toContainText('DISCOVERY REMEMBERED')
  await page.keyboard.press('Escape')
  await expect(page.locator('.game-xp')).toContainText('30')
  await page.reload()
  await expect(page.locator('.game-curiosity-count')).toContainText('3 / 3 discoveries')
})

test('mobile scenes, the journal, and nested sound-camp focus controls remain usable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await begin(page)
  for (const [width, height] of [
    [390, 844],
    [360, 844],
    [820, 844],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(
      true,
    )
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Enter chapter', exact: true }).click()
  await expect(page.locator('.dialogue-text')).toContainText('silence hasn’t taken everything')
  const text = await page.locator('.dialogue-text').boundingBox()
  expect(text!.y + text!.height).toBeLessThan(844)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Open field journal', exact: true }).click()
  await expect(page.locator('.journal-fact')).toContainText('more than 35,000 years old')
  await expect(page.locator('.journal-source')).toHaveAttribute(
    'href',
    'https://www.nature.com/articles/nature08169',
  )
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Pause game', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Journey menu', exact: true })
    .getByRole('button', { name: 'Visit the sound camp' })
    .click()
  await page.getByRole('button', { name: 'Focus on the soundscape', exact: true }).click()
  await expect(
    page.getByRole('dialog', { name: 'Soundscape focus room', exact: true }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'The sound camp', exact: true })).toBeVisible()
  await expect(
    page.getByRole('dialog', { name: 'Soundscape focus room', exact: true }),
  ).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('the published game shell, world art, stories, and instruments survive an offline reload', async ({
  page,
  context,
}) => {
  await begin(page)
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('.game-bottom-status')).toContainText('OFFLINE ADVENTURE')
  expect(
    await page
      .locator('.world-painting')
      .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 1000),
  ).toBe(true)
  await page.getByRole('button', { name: 'Enter chapter', exact: true }).click()
  await expect(page.locator('.story-scene-header')).toContainText('The Swabian Jura')
  await page.getByRole('button', { name: 'Skip scene', exact: true }).click()
  await expect(page.locator('.campaign-quest')).toContainText('Find a steady pulse')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Pause game', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Journey menu', exact: true })
    .getByRole('button', { name: 'Visit the sound camp' })
    .click()
  await page.getByRole('button', { name: 'Start the room', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pause the room', exact: true })).toBeVisible()
})
