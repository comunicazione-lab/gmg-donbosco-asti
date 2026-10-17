import struct
import zlib
import math

def write_png(filename, width, height, pixels):
    raw_lines = bytearray()
    row_size = width * 4
    for y in range(height):
        raw_lines.append(0)  # Filter byte 0
        raw_lines.extend(pixels[y * row_size:(y + 1) * row_size])

    compressed = zlib.compress(bytes(raw_lines), 9)

    def chunk(tag, data):
        crc = zlib.crc32(tag + data) & 0xffffffff
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', crc)

    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)

    with open(filename, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', ihdr))
        f.write(chunk(b'IDAT', compressed))
        f.write(chunk(b'IEND', b''))

def create_icon(size, out_path):
    pixels = bytearray(size * size * 4)
    r_corner = size * 0.22
    cx, cy = size / 2.0, size / 2.0

    for y in range(size):
        for x in range(size):
            idx = (y * size + x) * 4

            # Rounded squircle distance
            dx = max(0, abs(x - cx) - (cx - r_corner))
            dy = max(0, abs(y - cy) - (cy - r_corner))
            corner_dist = math.sqrt(dx * dx + dy * dy)
            
            if corner_dist > r_corner:
                # Outside rounded icon
                pixels[idx:idx+4] = b'\x00\x00\x00\x00'
                continue

            # Antialiasing on border
            alpha = 255
            if corner_dist > r_corner - 1.5:
                alpha = int(255 * max(0, min(1, (r_corner - corner_dist) / 1.5)))

            # Background gradient from (15, 23, 42) to (30, 27, 75)
            t = (x + y) / (2.0 * size)
            bg_r = int(15 * (1 - t) + 30 * t)
            bg_g = int(23 * (1 - t) + 27 * t)
            bg_b = int(42 * (1 - t) + 75 * t)

            # Center glow
            dist_center = math.sqrt((x - cx) ** 2 + (y - cy * 0.9) ** 2)
            glow = max(0.0, 1.0 - (dist_center / (size * 0.45)))
            bg_r = min(255, int(bg_r + glow * 40))
            bg_g = min(255, int(bg_g + glow * 30))
            bg_b = min(255, int(bg_b + glow * 90))

            cur_r, cur_g, cur_b = bg_r, bg_g, bg_b

            # Draw Flame / Heart motif in center
            # Normalized coords centered
            nx = (x - cx) / (size * 0.28)
            ny = (y - cy * 0.95) / (size * 0.28)
            # heart equation: (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0
            if -1.2 <= nx <= 1.2 and -1.2 <= ny <= 1.2:
                ny_inv = -ny + 0.2
                h_val = (nx**2 + ny_inv**2 - 0.7)**3 - (nx**2) * (ny_inv**3)
                if h_val <= 0.05:
                    cur_r = 244
                    cur_g = 63
                    cur_b = 94

            # Draw Gold Cross
            # Vertical beam: cx +/- w, cy +/- h
            cross_w = size * 0.045
            cross_top = size * 0.24
            cross_bottom = size * 0.72
            cross_left = size * 0.28
            cross_right = size * 0.72
            cross_bar_y = size * 0.38
            cross_bar_h = size * 0.045

            is_vert = (abs(x - cx) <= cross_w) and (cross_top <= y <= cross_bottom)
            is_horiz = (cross_left <= x <= cross_right) and (abs(y - cross_bar_y) <= cross_bar_h)

            if is_vert or is_horiz:
                cur_r = 251
                cur_g = 191
                cur_b = 36

            # Center Star / Dove diamond
            d_center = abs(x - cx) + abs(y - cross_bar_y)
            if d_center <= size * 0.06:
                cur_r = 255
                cur_g = 255
                cur_b = 255

            pixels[idx] = cur_r
            pixels[idx + 1] = cur_g
            pixels[idx + 2] = cur_b
            pixels[idx + 3] = alpha

    write_png(out_path, size, size, pixels)
    print(f"Generated {out_path} ({size}x{size})")

if __name__ == '__main__':
    create_icon(192, 'client/public/icon-192.png')
    create_icon(512, 'client/public/icon-512.png')
