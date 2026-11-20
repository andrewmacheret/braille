"""Draws the extension icons: six white braille dots on a blue rounded tile.

The tile keeps the dots visible on both light and dark toolbars.
Run from the repo root: python3 scripts/make-icons.py
"""
import struct
import zlib

TILE = (26, 115, 232)  # blue that reads on white and dark gray
DOT = (255, 255, 255)
SUPERSAMPLE = 8

# (size, padding) - the store wants 16px of empty space around the 128 icon
SIZES = [(16, 0), (32, 0), (48, 2), (128, 16)]


def coverage(size, padding):
    """Returns per-pixel (tile alpha, dot alpha) using supersampling."""
    inner = size - 2 * padding
    radius = inner * 0.2
    dot_radius = inner * 0.105
    dot_xs = [padding + inner * 0.31, padding + inner * 0.69]
    dot_ys = [padding + inner * 0.2, padding + inner * 0.5, padding + inner * 0.8]
    dots = [(x, y) for y in dot_ys for x in dot_xs]

    def in_tile(x, y):
        lo, hi = padding + radius, size - padding - radius
        cx = min(max(x, lo), hi)
        cy = min(max(y, lo), hi)
        inside_box = padding <= x <= size - padding and padding <= y <= size - padding
        return inside_box and (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2

    def in_dot(x, y):
        return any((x - dx) ** 2 + (y - dy) ** 2 <= dot_radius ** 2 for dx, dy in dots)

    pixels = []
    step = 1 / SUPERSAMPLE
    for py in range(size):
        row = []
        for px in range(size):
            tile = dot = 0
            for sy in range(SUPERSAMPLE):
                for sx in range(SUPERSAMPLE):
                    x = px + (sx + 0.5) * step
                    y = py + (sy + 0.5) * step
                    if in_tile(x, y):
                        tile += 1
                        if in_dot(x, y):
                            dot += 1
            total = SUPERSAMPLE * SUPERSAMPLE
            row.append((tile / total, dot / max(tile, 1)))
        pixels.append(row)
    return pixels


def write_png(path, pixels):
    raw = b""
    for row in pixels:
        raw += b"\x00"
        for tile, dot in row:
            color = [round(t * (1 - dot) + d * dot) for t, d in zip(TILE, DOT)]
            raw += bytes(color + [round(tile * 255)])
    height, width = len(pixels), len(pixels[0])

    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))

    header = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


for size, padding in SIZES:
    write_png(f"icons/icon{size}.png", coverage(size, padding))
