# Cadence: The Lost Symphony

A story-driven music game for people who have never played an instrument. The Archive’s musical memories have fallen silent. As a new Keeper, travel with Pip, a clockwork bird, recover six Echoes from historical settings, and bring them together in a final concert.

The default experience is a full-screen illustrated game world: a title screen, a movable camera, chapter markers, a companion, a main-quest tracker, and an Echo inventory. There is no account, microphone, backend, or external audio service.

## Run

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Build with `npm run build`; serve the production build with `npm run preview` on port 4173.

## The main storyline

The prologue introduces the Great Resonator, the Hush, the new Keeper, archivist Iona, and Pip. Each chapter has an arrival scene, a musical challenge, a story revelation, a recovered artifact, and a historical field note. Dialogue can be skipped or replayed from the journal. The prologue includes a small player choice that changes Pip’s response and is saved.

| Chapter                | Historical setting                    | Musical skill                        | Echo   |
| ---------------------- | ------------------------------------- | ------------------------------------ | ------ |
| I · Emberwood          | The Swabian Jura, deep prehistory     | Find and tap a steady pulse          | Pulse  |
| II · Marble Bay        | Tralles, Anatolia, 1st–2nd century CE | Distinguish higher and lower pitches | Voice  |
| III · Lantern Abbey    | Arezzo, around 1025                   | Recognize white piano-key names      | Symbol |
| IV · Clockwork Quarter | Bach’s Leipzig, 1723                  | Listen to and reproduce a melody     | Line   |
| V · Brasswater Harbor  | Early New Orleans jazz, around 1910   | Hear major and minor triads          | Color  |
| VI · Neon Heights      | Chicago house, early 1980s            | Compare tempos                       | Motion |

Recover an Echo by getting at least 60% of a chapter’s rounds right. There are no lives to lose: an unsuccessful attempt provides feedback and an immediate retry. Later chapters stay locked until earlier Echoes are recovered. Replaying completed chapters remains available.

The clues reveal that silence is part of music, rather than an enemy to erase. After recovering all six Echoes, enter the Great Resonator. The playable finale combines a four-note melody, four timed taps, and a choice between a major or minor ending. A short original synthesized concert and an epilogue complete the campaign. The restored world remains explorable.

Three optional island curiosities provide little musical discoveries and 10 XP each, once per save. Musical challenges award 20–50 XP per attempt; completing the finale awards a one-time 100 XP bonus.

## World controls

- Drag the island to move the camera; use + / − to zoom or the reset-camera button to reframe the selected chapter.
- Left/right arrows select available chapters. Enter begins the selected chapter when a control is not already focused.
- **J:** journal. **M:** sound on/off. **F:** browser fullscreen when supported. **Escape:** leave the current scene or open the pause menu.
- All chapter markers and actions are keyboard-accessible. On small screens, the camera follows the current chapter and the chapter dock stays reachable.
- Daylight/night presentation, reduced motion, and optional touch feedback are available through the journey menu. System reduced-motion preferences are respected.

## The field journal and music history

The adventure, the island, the characters, and their dialogue are fictional. Historical facts are stored separately from the story and include source links in the journal. These are selected musical histories, not a complete history of music or a single line of cultural progress. All musical puzzles and performances use original modern synthesis, not purported reconstructions or commercial recordings.

Sources checked for the historical entries:

- [Conard, Malina & Münzel, Nature (2009): New flutes document the earliest musical tradition in southwestern Germany](https://www.nature.com/articles/nature08169). The accessible abstract documents bone and ivory flutes more than 35,000 calendar years old. Surviving instruments do not date the first human music.
- [Seikilos epitaph](https://en.wikipedia.org/wiki/Seikilos_epitaph). Greek words and notation preserving a complete short song, generally dated to the 1st or 2nd century CE; older fragmentary notation also exists.
- [Guido of Arezzo](https://en.wikipedia.org/wiki/Guido_of_Arezzo). Staff-based teaching and solmization around 1025. Modern piano-key naming is a separate learning aid in the game.
- [Johann Sebastian Bach](https://en.wikipedia.org/wiki/Johann_Sebastian_Bach). His 1723 Leipzig appointment and contrapuntal practice. The game teaches single-line memory before more complex listening.
- [U.S. National Park Service: Jazz Origins in New Orleans](https://www.nps.gov/jazz/learn/historyculture/history_early.htm). Communities and traditions involved in jazz’s development, including the central contribution of Black musicians.
- [House music](https://en.wikipedia.org/wiki/House_music). Chicago’s early-1980s club culture and the central role of Black and Latino communities, including gay club communities.

The underlying teaching definitions were checked against [Open Music Theory](https://viva.pressbooks.pub/openmusictheory/), including its chapters on [meter](https://viva.pressbooks.pub/openmusictheory/chapter/simple-meter-and-time-signatures/), [the keyboard](https://viva.pressbooks.pub/openmusictheory/chapter/the-keyboard-and-grand-staff/), [triads](https://viva.pressbooks.pub/openmusictheory/chapter/triads/), and [tempo and other notation](https://viva.pressbooks.pub/openmusictheory/chapter/other-aspects-of-notation/). Chord moods are contextual listening cues rather than universal emotional rules.

## The sound camp

The camp is a freely accessible place to experiment between chapters:

- **Soundscape:** four moods with independent rhythm, bass, harmony, and melody layers. Play the melodic pads using A–K, mute or adjust layers, change tempo, and save a room. Its orbit and light ripples react to the actual Web Audio signal.
- **Piano:** a chromatic octave, warm and soft timbres, short melody recording, replay, and saved ideas. A–K plays white keys; W, E, T, Y, U plays black keys.
- **Beat maker:** an eight-step kick/snare/hi-hat sequencer with tempo control and saved patterns.

The earlier open practice library remains available at `?mode=practice` for standalone lessons and regression testing. Practice completions do not bypass story progression. Existing XP, saved ideas, and beat patterns are preserved.

## Save data

Everything stays in the current browser on the current device; there is no cross-device sync.

| Key                   | Contents                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `cadence-story-v1`    | Started campaign, contiguous cleared chapters, discovered field notes, optional curiosities, prologue choice, and ending |
| `cadence-progress-v1` | XP, practice history, streaks, and saved-idea count                                                                      |
| `cadence-ideas`       | The latest 12 recorded note-event ideas                                                                                  |
| `cadence-beat`        | Saved drum pattern                                                                                                       |
| `cadence-soundscape`  | Saved mood, tempo, layer levels, and layer mutes                                                                         |
| `cadence-experience`  | Display, motion, and touch preferences                                                                                   |

Story saves are validated on load. Completing a chapter saves the recovered Echo before its reward scene, so reloading never loses an earned Echo. Clearing browser site data removes these local saves. Recordings store note events rather than microphone audio and are limited to 64 notes or 30 seconds.

## Install and play offline

The production build includes a manifest, icons, and a Workbox service worker generated with `vite-plugin-pwa`. The world illustration, all story text, fonts, code, and UI assets are precached. Every sound is synthesized locally using Web Audio.

1. Visit once online over HTTPS or localhost and let the game finish loading.
2. Open the journey menu → **Take the journey offline**, use the browser’s Install command, or use Safari → Share → Add to Home Screen.
3. Reload or reopen offline. Chapters, journal entries, the finale, art, and sound camp remain playable.

Historical source links lead to external websites and require a connection; the full in-game field notes remain offline. Updates prompt before activation and wait until you are out of a scene, challenge, or menu. The development server does not register a service worker; verify offline behavior with a production build and `npm run preview`.

## Automatic GitHub Pages publishing

Every push to `main` automatically verifies and publishes the game. The publishing workflow calls the reusable check workflow first. A failing production build or browser test blocks deployment. Pull requests and pushes to other branches run checks without deploying.

1. In GitHub **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
2. Push to `main`. **Publish Cadence to GitHub Pages** verifies, builds with the correct Pages base path, and deploys.
3. Manual runs remain available in the Actions tab.

The workflow supports a repository path such as https://sloth-os.github.io/music/, an account site, or a configured custom domain. Manifest and service-worker scope follow the path. To build a known path locally:

```sh
BASE_PATH=/music/ npm run build
```

## Verify

```sh
npx playwright install chromium
npm run build
npm test
```

Browser coverage includes an actual complete six-chapter campaign and finale; character choice and save persistence; chapter gating and failed-attempt recovery; historical journal links; optional rewards; mobile layout and nested focus controls; and offline world art, story, and instruments. The standalone practice suite also checks every musical activity, recorded ideas, beat editing, theme preferences, and synthesized audio output. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an existing Chromium installation.

Built with React, TypeScript, Vite, Lucide, locally bundled DM Sans and Fraunces, original SVG character/glyph art, and a custom generated environment illustration optimized to WebP. No game engine or remote rendering dependency is required. The audio architecture follows [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices).
