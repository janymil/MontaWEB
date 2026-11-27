"""Cut vertical 1080x1920 clips from a 16:9 episode, with big captions.

Usage: python scripts/make-shorts.py <clips.json>
clips.json: {"video", "words", "out", "footer", "fix": {"wrong": "right"},
             "clips": [{"name", "start", "end", "title"}]}
Needs ffmpeg with libass. The full 16:9 frame is kept (no crop), so on-screen text survives.
"""
import json
import subprocess
import sys
from pathlib import Path

HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,Segoe UI,78,&H001A1A1A,&H00000000,&H00000000,1,1,0,0,8,70,70,230,1
Style: Caption,Segoe UI,76,&H001A1A1A,&H00000000,&H00000000,1,1,0,0,8,80,80,1290,1
Style: Footer,Segoe UI,46,&H00FFFFFF,&H001A1A1A,&H001A1A1A,1,3,14,0,2,60,60,150,1

[Events]
Format: Layer, Start, End, Style, Text
"""


def stamp(seconds):
    cs = max(0, round(seconds * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def chunks(words, size=26):
    """Group words into short captions, breaking on punctuation, length or a pause."""
    line = []
    for w in words:
        if line and (len(" ".join(x["w"] for x in line + [w])) > size or w["start"] - line[-1]["end"] > 0.6):
            yield line
            line = []
        line.append(w)
        if w["w"][-1] in ".?!":
            yield line
            line = []
    if line:
        yield line


def main(config_path):
    cfg = json.loads(Path(config_path).read_text(encoding="utf-8"))
    words = json.loads(Path(cfg["words"]).read_text(encoding="utf-8"))
    out = Path(cfg["out"])
    out.mkdir(parents=True, exist_ok=True)
    for clip in cfg["clips"]:
        start, end = clip["start"], clip["end"]
        length = end - start
        picked = [dict(w) for w in words if start <= w["start"] < end]
        for w in picked:
            for wrong, right in cfg.get("fix", {}).items():
                w["w"] = w["w"].replace(wrong, right)
        events = [
            f"Dialogue: 0,{stamp(0)},{stamp(length)},Title,{clip['title']}",
            f"Dialogue: 0,{stamp(0)},{stamp(length)},Footer,{cfg['footer']}",
        ]
        groups = list(chunks(picked))
        for i, group in enumerate(groups):
            begin = group[0]["start"] - start
            stop = group[-1]["end"] - start + 0.4
            if i + 1 < len(groups):
                stop = min(stop, groups[i + 1][0]["start"] - start)
            events.append(f"Dialogue: 0,{stamp(begin)},{stamp(stop)},Caption,{' '.join(w['w'] for w in group)}")
        ass = out / f"{clip['name']}.ass"
        ass.write_text(HEADER + "\n".join(events) + "\n", encoding="utf-8-sig")
        graph = (
            "[0:v]scale=1080:608,setsar=1,pad=1080:1920:0:600:color=0xF3EFE4,"
            f"ass={ass.name}[v];"
            f"[0:a]afade=t=in:d=0.15,afade=t=out:st={length - 0.25:.2f}:d=0.25[a]"
        )
        # cwd=out keeps the filter argument free of Windows drive letters.
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-ss", str(start), "-t", f"{length:.2f}",
             "-i", str(Path(cfg["video"]).resolve()), "-filter_complex", graph,
             "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "20", "-preset", "medium",
             "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart",
             f"{clip['name']}.mp4"],
            cwd=out, check=True,
        )
        print(f"{clip['name']}.mp4 {length:.1f}s")


if __name__ == "__main__":
    main(sys.argv[1])
