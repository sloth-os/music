"""Generate the offline cast with Kokoro ONNX, then encode compact MP3s.

Requires kokoro-onnx, soundfile, ffmpeg, and the Kokoro v1.0 ONNX/voices models.
Usage: python scripts/generate-narration.py --models /path/to/models
The models and Python environment are generation tools; neither ships to players.
"""
import argparse
import json
from pathlib import Path
import subprocess
import tempfile
import time

import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parents[1]
CAST = {
    'iona': {'voice': 'bf_emma', 'speed': 0.98, 'lang': 'en-gb', 'description': 'Calm, warm British archivist'},
    'pip': {'voice': 'am_puck', 'speed': 1.08, 'lang': 'en-us', 'description': 'Bright, lively American companion'},
    'keeper': {'voice': 'am_michael', 'speed': 1.02, 'lang': 'en-us', 'description': 'Curious, grounded American listener'},
    'memory': {'voice': 'af_heart', 'speed': 0.97, 'lang': 'en-us', 'description': 'Warm, measured storyteller'},
}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--models', type=Path, required=True)
    parser.add_argument('--force', action='store_true')
    args = parser.parse_args()
    lines = json.loads(subprocess.check_output(['node', '--experimental-strip-types', 'scripts/narration-lines.mjs', '--json'], cwd=ROOT))
    output = ROOT / 'public/game/voices'
    output.mkdir(parents=True, exist_ok=True)
    manifest_path = ROOT / 'src/game/voice-manifest.json'
    previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {'lines': {}}
    options = ort.SessionOptions()
    options.intra_op_num_threads = 4
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(args.models / 'kokoro-v1.0.int8.onnx'), sess_options=options, providers=['CPUExecutionProvider'])
    kokoro = Kokoro.from_session(session, str(args.models / 'voices-v1.0.bin'))
    available = kokoro.get_voices()
    for cast in CAST.values():
        if cast['voice'] not in available:
            raise RuntimeError(f"Missing character voice {cast['voice']}; available: {available}")
    manifest = {'version': 1, 'engine': 'Kokoro-82M v1.0, INT8', 'cast': CAST, 'lines': {}}
    start = time.monotonic()
    for i, line in enumerate(lines):
        line_id, speaker, text = line['id'], line['speaker'], line['text']
        path = output / f'{line_id}.mp3'
        if not args.force and path.exists() and line_id in previous.get('lines', {}):
            manifest['lines'][line_id] = previous['lines'][line_id]
            print(f'{i+1}/{len(lines)} cached {line_id}', flush=True)
            continue
        cast = CAST[speaker]
        samples, rate = kokoro.create(text, voice=cast['voice'], speed=cast['speed'], lang=cast['lang'])
        if not len(samples) or not np.isfinite(samples).all() or np.max(np.abs(samples)) < 0.01:
            raise RuntimeError(f'Invalid or silent narration: {line_id}')
        with tempfile.NamedTemporaryFile(suffix='.wav') as wav:
            sf.write(wav.name, samples, rate)
            subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', wav.name, '-ac', '1', '-ar', '24000', '-codec:a', 'libmp3lame', '-b:a', '64k', '-af', 'loudnorm=I=-18:TP=-2:LRA=8', '-map_metadata', '-1', str(path)], check=True)
        duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(path)]))
        manifest['lines'][line_id] = {'file': f'game/voices/{path.name}', 'speaker': speaker, 'duration': round(duration, 3), 'bytes': path.stat().st_size}
        # A partial generation can be resumed after interruption.
        manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
        print(f'{i+1}/{len(lines)} {line_id} {duration:.1f}s / {path.stat().st_size//1024} KiB; elapsed {time.monotonic()-start:.1f}s', flush=True)
    expected = {f'{line["id"]}.mp3' for line in lines}
    for path in output.glob('*.mp3'):
        if path.name not in expected:
            path.unlink()
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Generated {len(lines)} narrated lines, {sum(v["bytes"] for v in manifest["lines"].values())/1024/1024:.2f} MiB.', flush=True)

if __name__ == '__main__':
    main()
