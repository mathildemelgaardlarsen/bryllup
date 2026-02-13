#!/usr/bin/env python3
"""Extract dominant colors from an image using ImageMagick.

Usage:
  python3 tools/extract_palette.py path/to/image.jpg --colors 8
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
import tempfile
from pathlib import Path


def extract_palette(image_path: Path, colors: int) -> list[tuple[int, str, tuple[int, int, int]]]:
  cmd = [
    "magick",
    str(image_path),
    "-resize",
    "1200x1200>",
    "-colors",
    str(colors),
    "-format",
    "%c",
    "histogram:info:-",
  ]
  out = subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT)

  pattern = re.compile(r"\s*(\d+):\s*\(([\d.]+),([\d.]+),([\d.]+)")
  hex_pattern = re.compile(r"#([0-9A-Fa-f]{6})")

  palette = []
  for line in out.splitlines():
    m = pattern.search(line)
    h = hex_pattern.search(line)
    if not m or not h:
      continue

    count = int(m.group(1))
    r = int(float(m.group(2)))
    g = int(float(m.group(3)))
    b = int(float(m.group(4)))
    hex_value = f"#{h.group(1).lower()}"
    palette.append((count, hex_value, (r, g, b)))

  palette.sort(key=lambda x: x[0], reverse=True)
  return palette


def main() -> int:
  parser = argparse.ArgumentParser(description="Extract dominant image colors")
  parser.add_argument("image", type=Path, help="Path to image")
  parser.add_argument("--colors", type=int, default=8, help="Number of colors")
  args = parser.parse_args()

  if not args.image.exists():
    print(f"File not found: {args.image}", file=sys.stderr)
    return 1

  try:
    palette = extract_palette(args.image, args.colors)
  except subprocess.CalledProcessError:
    with tempfile.TemporaryDirectory() as temp_dir:
      converted = Path(temp_dir) / "converted.jpg"
      ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(args.image),
        "-frames:v",
        "1",
        str(converted),
      ]
      try:
        subprocess.check_output(ffmpeg_cmd, stderr=subprocess.STDOUT, text=True)
        palette = extract_palette(converted, args.colors)
      except subprocess.CalledProcessError as exc:
        print("Failed to analyze image with both ImageMagick and ffmpeg fallback.", file=sys.stderr)
        print(exc.output, file=sys.stderr)
        return 2

  print(f"Image: {args.image}")
  print(f"Dominant colors ({len(palette)}):")
  for count, hex_value, rgb in palette:
    print(f"- {hex_value} rgb{rgb} pixels={count}")
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
