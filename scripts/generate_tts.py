#!/usr/bin/env python3
"""
Sinh file âm thanh TTS (tiếng Việt) cho speech-game.

Backends:
  - gtts (mặc định): Google TTS, cần mạng; không chọn được giới (thường nghe như giọng nữ).
  - edge: Neural Edge; mặc định giọng nam vi-VN-NamMinhNeural. Giọng nữ: --voice vi-VN-HoaiMyNeural.
    Một số mạng bị 403 khi gọi Edge.

Cài đặt:
  pip install -r scripts/requirements-tts.txt

Chạy (từ thư mục gốc repo):
  python scripts/generate_tts.py
  python scripts/generate_tts.py --backend edge --animals

Đọc câu từ src/constants/phrases.js và (tùy chọn) answer từ src/data/animals.js,
ghi MP3 vào public/sounds/tts/ và manifest.json. Sau khi sửa phrases/animals, chạy lại script.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
import sys
from pathlib import Path

edge_tts = None  # type: ignore
try:
    import edge_tts as _edge_tts

    edge_tts = _edge_tts
except ImportError:
    pass

try:
    from gtts import gTTS
except ImportError:
    gTTS = None  # type: ignore

REPO_ROOT = Path(__file__).resolve().parent.parent
PHRASES_PATH = REPO_ROOT / "src" / "constants" / "phrases.js"
ANIMALS_PATH = REPO_ROOT / "src" / "data" / "animals.js"
# Edge Neural: Nam Minh = nam, Hoai My = nữ
DEFAULT_VOICE = "vi-VN-NamMinhNeural"


def _extract_js_string_array(content: str, export_name: str) -> list[str]:
    """Lấy các chuỗi trong mảng export const NAME = [ "a", "b" ];"""
    m = re.search(
        rf"export const {re.escape(export_name)}\s*=\s*\[(.*?)\];",
        content,
        re.DOTALL,
    )
    if not m:
        raise ValueError(f"Không tìm thấy mảng {export_name} trong file")
    block = m.group(1)
    return re.findall(r'"((?:\\.|[^"\\])*)"', block)


def _extract_js_string_const(content: str, export_name: str) -> str:
    m = re.search(rf'export const {re.escape(export_name)}\s*=\s*"((?:\\.|[^"\\])*)";', content)
    if not m:
        raise ValueError(f"Không tìm thấy chuỗi {export_name} trong file")
    raw = m.group(1)
    return bytes(raw, "utf-8").decode("unicode_escape") if "\\" in raw else raw


def load_phrase_jobs() -> list[tuple[str, str]]:
    text = PHRASES_PATH.read_text(encoding="utf-8")
    jobs: list[tuple[str, str]] = []

    jobs.append(("teacher_question", _extract_js_string_const(text, "TEACHER_QUESTION")))
    jobs.append(("wrong_reveal_prefix", _extract_js_string_const(text, "WRONG_REVEAL_PREFIX")))
    jobs.append(("timeout_reveal_prefix", _extract_js_string_const(text, "TIMEOUT_REVEAL_PREFIX")))

    for i, s in enumerate(_extract_js_string_array(text, "POSITIVE_RESPONSES")):
        jobs.append((f"positive_{i}", s))

    # Trước đây có RETRY_RESPONSES; hiện đã bỏ (sai -> đọc prefix + đáp án con vật)
    try:
        for i, s in enumerate(_extract_js_string_array(text, "RETRY_RESPONSES")):
            jobs.append((f"retry_{i}", s))
    except ValueError:
        pass

    # Cảnh báo trình duyệt — thường không cần TTS trong game; vẫn có thể sinh nếu muốn
    try:
        jobs.append(("speech_not_supported", _extract_js_string_const(text, "SPEECH_NOT_SUPPORTED")))
    except ValueError:
        pass

    return jobs


def load_animal_answer_jobs() -> list[tuple[str, str]]:
    text = ANIMALS_PATH.read_text(encoding="utf-8")
    # animals.js dùng key không quote: id: 1, answer: "mèo"
    ids = re.findall(r"\bid\s*:\s*(\d+)", text)
    answers = re.findall(r"\banswer\s*:\s*\"((?:\\.|[^\"\\])*)\"", text)
    if not ids or len(ids) != len(answers):
        raise ValueError("Không parse được animals.js (định dạng đổi?)")
    jobs: list[tuple[str, str]] = []
    for aid, raw in zip(ids, answers):
        s = bytes(raw, "utf-8").decode("unicode_escape") if "\\" in raw else raw
        jobs.append((f"animal_{int(aid):02d}_answer", s))
    return jobs


def load_wrong_reveal_jobs() -> list[tuple[str, str]]:
    """Sinh 1 file mp3 hoàn chỉnh cho từng con để tránh khựng khi ghép 2 mp3."""
    phrases = PHRASES_PATH.read_text(encoding="utf-8")
    prefix = _extract_js_string_const(phrases, "WRONG_REVEAL_PREFIX").strip()
    prefix = prefix.rstrip(" ,.")

    text = ANIMALS_PATH.read_text(encoding="utf-8")
    ids = re.findall(r"\bid\s*:\s*(\d+)", text)
    answers = re.findall(r"\banswer\s*:\s*\"((?:\\.|[^\"\\])*)\"", text)
    if not ids or len(ids) != len(answers):
        raise ValueError("Không parse được animals.js (định dạng đổi?)")

    jobs: list[tuple[str, str]] = []
    for aid, raw in zip(ids, answers):
        ans = bytes(raw, "utf-8").decode("unicode_escape") if "\\" in raw else raw
        jobs.append((f"wrong_reveal_animal_{int(aid):02d}", f"{prefix} {ans}"))
    return jobs


def load_timeout_reveal_jobs() -> list[tuple[str, str]]:
    """Sinh mp3 riêng cho trường hợp hết giờ: 'Đây là con <đáp án>'."""
    phrases = PHRASES_PATH.read_text(encoding="utf-8")
    prefix = _extract_js_string_const(phrases, "TIMEOUT_REVEAL_PREFIX").strip()
    prefix = prefix.rstrip(" ,.")

    text = ANIMALS_PATH.read_text(encoding="utf-8")
    ids = re.findall(r"\bid\s*:\s*(\d+)", text)
    answers = re.findall(r"\banswer\s*:\s*\"((?:\\.|[^\"\\])*)\"", text)
    if not ids or len(ids) != len(answers):
        raise ValueError("Không parse được animals.js (định dạng đổi?)")

    jobs: list[tuple[str, str]] = []
    for aid, raw in zip(ids, answers):
        ans = bytes(raw, "utf-8").decode("unicode_escape") if "\\" in raw else raw
        jobs.append((f"timeout_reveal_animal_{int(aid):02d}", f"{prefix} {ans}"))
    return jobs


def slug_safe_audio_id(audio_id: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_.-]+", "_", audio_id).strip("_") or "clip"


async def synthesize_edge(text: str, out_path: Path, voice: str, rate: str) -> None:
    if edge_tts is None:
        raise RuntimeError("Cài edge-tts: pip install -r scripts/requirements-tts.txt")
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(str(out_path))


def synthesize_gtts(text: str, out_path: Path) -> None:
    if gTTS is None:
        raise RuntimeError("Cài gTTS: pip install -r scripts/requirements-tts.txt")
    tts = gTTS(text=text, lang="vi", slow=False)
    tts.save(str(out_path))


async def run_all(
    jobs: list[tuple[str, str]],
    out_dir: Path,
    backend: str,
    voice: str,
    rate: str,
    skip_existing: bool,
) -> dict[str, str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    mapping: dict[str, str] = {}

    for audio_id, text in jobs:
        fname = f"{slug_safe_audio_id(audio_id)}.mp3"
        dest = out_dir / fname
        if skip_existing and dest.is_file():
            mapping[audio_id] = fname
            continue
        if backend == "edge":
            await synthesize_edge(text, dest, voice, rate)
        elif backend == "gtts":
            await asyncio.to_thread(synthesize_gtts, text, dest)
        else:
            raise ValueError(f"backend không hỗ trợ: {backend}")
        mapping[audio_id] = fname

    manifest = {
        "backend": backend,
        "voice": voice if backend == "edge" else "gTTS-vi",
        "rate": rate if backend == "edge" else None,
        "basePath": "/sounds/tts/",
        "clips": mapping,
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return mapping


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sinh MP3 TTS cho speech-game",
        epilog="Giọng nam (Edge): mặc định vi-VN-NamMinhNeural. Giọng nữ Edge: --voice vi-VN-HoaiMyNeural. "
        "Backend gtts không chọn được nam/nữ.",
    )
    parser.add_argument(
        "--backend",
        choices=("gtts", "edge"),
        default="gtts",
        help="gtts: Google (ổn định, không chọn giới). edge: Neural, mặc định giọng nam (Nam Minh).",
    )
    parser.add_argument(
        "--voice",
        default=DEFAULT_VOICE,
        help=f"Chỉ với --backend edge (mặc định nam: {DEFAULT_VOICE})",
    )
    parser.add_argument("--rate", default="+0%", help="Chỉ dùng với --backend edge")
    parser.add_argument(
        "--out",
        type=Path,
        default=REPO_ROOT / "public" / "sounds" / "tts",
        help="Thư mục ghi MP3 + manifest.json",
    )
    parser.add_argument("--animals", action="store_true", help="Thêm TTS cho trường answer của từng con vật")
    parser.add_argument("--skip-existing", action="store_true", help="Bỏ qua file MP3 đã tồn tại")
    parser.add_argument("--list-voices", action="store_true", help="Liệt kê giọng rồi thoát")
    args = parser.parse_args()

    if args.list_voices:
        if edge_tts is None:
            print("Cài edge-tts để dùng --list-voices.", file=sys.stderr)
            sys.exit(1)

        async def _list() -> None:
            voices = await edge_tts.list_voices()
            for v in voices:
                if str(v.get("Locale", "")).lower().startswith("vi"):
                    print(f'{v.get("ShortName")}\t{v.get("Gender")}\t{v.get("FriendlyName")}')

        asyncio.run(_list())
        return

    if not PHRASES_PATH.is_file():
        print(f"Không thấy file: {PHRASES_PATH}", file=sys.stderr)
        sys.exit(1)

    jobs = load_phrase_jobs()
    if args.animals:
        if not ANIMALS_PATH.is_file():
            print(f"Không thấy file: {ANIMALS_PATH}", file=sys.stderr)
            sys.exit(1)
        jobs = jobs + load_animal_answer_jobs() + load_wrong_reveal_jobs() + load_timeout_reveal_jobs()

    if args.backend == "gtts" and gTTS is None:
        print("Thiếu gTTS. Chạy: pip install -r scripts/requirements-tts.txt", file=sys.stderr)
        sys.exit(1)
    if args.backend == "edge" and edge_tts is None:
        print("Thiếu edge-tts. Chạy: pip install -r scripts/requirements-tts.txt", file=sys.stderr)
        sys.exit(1)

    print(f"Backend: {args.backend}  →  {args.out.resolve()}  ({len(jobs)} clip)")
    asyncio.run(run_all(jobs, args.out, args.backend, args.voice, args.rate, args.skip_existing))
    print("Xong. Mở public/sounds/tts/manifest.json để map id → file khi tích hợp React.")


if __name__ == "__main__":
    main()
