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

All 75 story and listening-guide lines are spoken by four distinct neural TTS voices: Iona, Pip, the Keeper, and the living memories. Voices begin when you enter a scene, with captions visible, and story conversations advance after each spoken line. Player choices always wait for input. Pause or replay a line, select **Wait for me** for manual progression, or open the dialogue’s voice options to change volume, speaking pace (0.75×–1.5×), or switch to captions. These preferences also appear in **Your experience** and persist on this device. Game mute controls dialogue too. Music softens while a story character speaks; listening missions pause their music before a guide speaks, so comparisons stay clear. Skipping or leaving a scene stops the voice immediately. Switching away from the game pauses the scene.

The voice tracks are generated ahead of time and bundled as MP3s (about 4.2 MiB for the complete cast). They work without installed browser voices, an API key, a speech service, or a model download at runtime. If a browser blocks playback, a visible play button retries it; captions and manual progression remain available.

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

## Act II: Inside a song

The restored Archive opens a listening room: three complete pieces, each with eight practical missions. **Take a song apart** becomes the main action after the ending. The record icon and journey menu also open it during the earlier campaign; existing players can enter directly without replaying completed chapters.

| Complete piece      | Length at original tempo | Musical setting                                                                                 | What to notice                                                           |
| ------------------- | ------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **First Light**     | 20 bars / 44 seconds     | Original instrumental pop; C major; four beats per bar                                          | Intro → verse → chorus → verse → chorus → outro; a higher returning hook |
| **Lantern Waltz**   | 12 bars / 23 seconds     | Original waltz; A minor; three beats per bar                                                    | Bass on beat one, chords on two and three; A → B → A                     |
| **A Familiar Star** | 12 bars / 29 seconds     | Complete public-domain “Ah! vous dirai-je, maman” / “Twinkle” melody; new C-major accompaniment | A familiar tune, a contrasting middle, and the return of the opening     |

Each record teaches the same listening process, so players can try their ears on a different piece:

1. **Meet the whole song.** Hear the piece through its ending and record a personal reaction. The playhead, bar counter, pulse lights, and original score connect what you hear with where you are.
2. **Find the players.** Hear four isolated parts and identify melody, chords, bass, and drums by sound. A wrong answer explains the role and allows another try.
3. **The missing player.** Compare the same passage with and without a musical layer; identify what disappeared.
4. **Change the combination.** Compare melody plus bass, the full band, and a parallel major/minor version. Rhythm and tempo stay consistent across these comparisons. Describe your own reaction; feelings are never marked right or wrong.
5. **Map the journey.** Audition the numbered passages and label their section identities. Returning ideas need the same label. Check and revise the whole map.
6. **Find the way home.** Learn the home chord, then compare a home ending with an open dominant ending. The answer unlocks only after hearing the point where they differ.
7. **The imperfect performance.** Compare a reference with three takes containing a changed melody pitch, a late drum beat, or a missing melody note. Identify both the difference and its bar. Slow playback and repeating excerpts support focused listening. These are deviations from the intended reference, not a claim that every unusual note is a mistake.
8. **Make the tune shine.** Hear a mix whose accompaniment buries the tune. Adjust the actual four layer gains, retain the whole band, audition the new balance, and compare it with the original problem. This lesson has a specific goal; its target balance is not a universal rule for a good mix.

The record player uses complete, separately composed note-event layers and local Web Audio synthesis. It supports immediate solo, mute, and volume changes; pause/resume; 0.75×, 1×, and 1.25× listening pace without transposing the notes; and repeatable excerpts. Comparison takes change the sounding notes or timing, rather than just their labels. The piano roll shows the original reference arrangement. The mobile room has separate **The mission** and **Player & faders** views, with a bar counter next to the listening questions.

Mission progress, personal feeling words, and completed-record mixes are saved. Each record awards 100 XP once; revisiting it or saving another mix does not award XP again. Completed records open to a listening summary and the saved mix. Replay any mission, freely remix the full piece, or try the same skills on another record. These teaching arrangements separate four roles clearly; in other music, instruments can share roles, and some of these roles may be absent.

Teaching references include Open Music Theory’s [texture](https://viva.pressbooks.pub/openmusictheory/chapter/texture/) and [verse-chorus form](https://viva.pressbooks.pub/openmusictheory/chapter/verse-chorus-form/) chapters, alongside the harmony, meter, and keyboard sources below. The two original pieces are modern teaching examples; the familiar melody has an original synthesized accompaniment. No commercial recording, external audio stream, microphone, or uploaded song is required.

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

| Key                    | Contents                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `cadence-story-v1`     | Started campaign, contiguous cleared chapters, discovered field notes, optional curiosities, prologue choice, and ending |
| `cadence-progress-v1`  | XP, practice history, streaks, and saved-idea count                                                                      |
| `cadence-ideas`        | The latest 12 recorded note-event ideas                                                                                  |
| `cadence-beat`         | Saved drum pattern                                                                                                       |
| `cadence-soundscape`   | Saved mood, tempo, layer levels, and layer mutes                                                                         |
| `cadence-experience`   | Display, motion, touch, character voices, voice volume/pace, and dialogue progression preferences                        |
| `cadence-listening-v1` | Act II introduction, selected record, contiguous mission completions, personal feeling words, and saved mixes            |

Story saves are validated on load. Completing a chapter saves the recovered Echo before its reward scene, so reloading never loses an earned Echo. Clearing browser site data removes these local saves. Recordings store note events rather than microphone audio and are limited to 64 notes or 30 seconds.

## Install and play offline

The production build includes a manifest, icons, and a Workbox service worker generated with `vite-plugin-pwa`. The world illustration, all story text, all 75 character and guide voice tracks, fonts, code, and UI assets are precached (about 5.6 MiB total). Instruments and complete song performances are synthesized locally using Web Audio.

1. Visit once online over HTTPS or localhost and let the game finish loading.
2. Open the journey menu → **Take the journey offline**, use the browser’s Install command, or use Safari → Share → Add to Home Screen.
3. Reload or reopen offline. Chapters, spoken dialogue, journal entries, the finale, art, sound camp, and every Act II record and mission remain playable, including material you have not visited before.

Historical source links lead to external websites and require a connection; the full in-game field notes remain offline. Updates prompt before activation and wait until you are out of a scene, challenge, or menu. The development server does not register a service worker; verify offline behavior with a production build and `npm run preview`.

## Regenerate character voices

The committed tracks use the stock voices in [Kokoro-82M v1.0](https://huggingface.co/hexgrad/Kokoro-82M) (Apache-2.0), generated locally with [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) (MIT). Cast and original generation speeds are recorded in `src/game/voice-manifest.json`. No model weights ship with the game. Normal development, CI, and publishing use the committed tracks and require only Node.js 22.6+ and npm.

After changing story dialogue, regenerate its audio with Python 3.12, FFmpeg/ffprobe, and the ONNX models. Install the optional Python tools in a virtual environment and download `kokoro-v1.0.int8.onnx` and `voices-v1.0.bin` from the [v1.0 model release](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0) into a directory outside the repository:

```sh
python3 -m venv /tmp/cadence-voices
/tmp/cadence-voices/bin/pip install -r scripts/requirements-voices.txt
/tmp/cadence-voices/bin/python scripts/generate-narration.py --models /path/to/models
npm run voices:check
```

The generator resumes unchanged lines, normalizes speech loudness, writes compact MP3s and a manifest, and removes stale tracks after completing the full script. Use `--force` after changing the cast or generation settings. Commit the updated MP3s and manifest together with the dialogue. Every build verifies that all current story lines have complete matching voice tracks, so an edited line cannot silently lose its voice on publish.

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

Browser coverage includes an actual complete six-chapter campaign and finale; character choice and save persistence; chapter gating and failed-attempt recovery; historical journal links; optional rewards; mobile layout and nested focus controls; and offline world art, story, and instruments. Act II tests listen through a full record and complete all eight missions, including incorrect answers, the entire section map, all three performance repairs, a before/after mix, saved progress, and one-time rewards. They measure the synthesized song signal, mute individual layers, pause/resume, check three-beat meter and mobile views, and play unheard records and spoken guides offline. Score checks verify complete forms and that each altered performance changes exactly the advertised musical property. Voice tests measure actual decoded speech, exercise playback controls, verify automatic conversations and saved preferences, and recover from blocked playback and failed downloads. The standalone practice suite also checks every musical activity, recorded ideas, beat editing, theme preferences, and synthesized audio output. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an existing Chromium installation.

Built with React, TypeScript, Vite, Lucide, locally bundled DM Sans and Fraunces, original SVG character/glyph art, and a custom generated environment illustration optimized to WebP. No game engine or remote rendering dependency is required. The audio architecture follows [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices).
