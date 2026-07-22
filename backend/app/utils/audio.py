import os
import wave
import contextlib
import logging

logger = logging.getLogger("meetmind.audio")

def get_audio_duration(filepath: str) -> float:
    """
    Calculates audio duration in seconds.
    Uses mutagen for MP3/M4A/MP4, native wave parser for WAV,
    and falls back to size-based estimation (128 kbps) if all else fails.
    """
    if not os.path.exists(filepath):
        return 0.0

    ext = os.path.splitext(filepath)[1].lower()

    # 1. WAV — use native wave parser (no dependency needed)
    if ext == ".wav":
        try:
            with contextlib.closing(wave.open(filepath, "rb")) as f:
                frames = f.getnframes()
                rate = f.getframerate()
                duration = frames / float(rate)
                if duration > 0:
                    return duration
        except Exception as e:
            logger.warning(f"wave parser failed for {filepath}: {e}")

    # 2. MP3 / M4A / MP4 — use mutagen (accurate, no ffmpeg needed)
    try:
        from mutagen.mp3 import MP3
        from mutagen.mp4 import MP4
        from mutagen import File as MutagenFile

        if ext == ".mp3":
            audio = MP3(filepath)
            duration = audio.info.length
        elif ext in (".m4a", ".mp4"):
            audio = MP4(filepath)
            duration = audio.info.length
        else:
            # Generic fallback through mutagen for any other format
            audio = MutagenFile(filepath)
            duration = audio.info.length if audio else 0.0

        if duration and duration > 0:
            return duration

    except ImportError:
        logger.warning("mutagen not installed — falling back to size estimation. Run: pip install mutagen")
    except Exception as e:
        logger.warning(f"mutagen failed for {filepath}: {e}")

    # 3. Last resort: size-based estimate (assumes 128 kbps = 16 KB/s)
    try:
        file_size = os.path.getsize(filepath)
        estimated = file_size / 16000.0
        logger.warning(f"Using size-based duration estimate for {filepath}: {estimated:.1f}s")
        return max(estimated, 1.0)
    except Exception:
        return 0.0