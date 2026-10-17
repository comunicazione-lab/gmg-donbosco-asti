import struct
import zlib
import math

def write_png(filename, width, height, rgba_data):
    """Writes an RGBA PNG file from raw bytes."""
    raw_lines = bytearray()
    row_size = width * 4
    for y in range(height):
        raw_lines.append(0)  # Filter byte None
        raw_lines.extend(rgba_data[y * row_size:(y + 1) * row_size])

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

def read_source_png(filepath):
    with open(filepath, 'rb') as f:
        data = f.read()

    pos = 8
    palette = []
    idat_parts = []
    w, h = 0, 0

    while pos < len(data):
        length, tag = struct.unpack('>I4s', data[pos:pos+8])
        chunk_data = data[pos+8:pos+8+length]
        pos += 8 + length + 4
        if tag == b'IHDR':
            w, h = struct.unpack('>II', chunk_data[:8])
        elif tag == b'PLTE':
            palette = [chunk_data[i:i+3] for i in range(0, len(chunk_data), 3)]
        elif tag == b'IDAT':
            idat_parts.append(chunk_data)

    decompressed = zlib.decompress(b''.join(idat_parts))
    
    # Convert indexed palette to RGBA
    # White background (255, 255, 255) becomes transparent
    rgba = bytearray(w * h * 4)
    for y in range(h):
        row_indices = decompressed[y * (w + 1) + 1 : (y + 1) * (w + 1)]
        for x in range(w):
            idx = row_indices[x]
            r, g, b = palette[idx]
            dst_idx = (y * w + x) * 4
            
            # Smooth transparency for white/near-white background
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            if r > 250 and g > 250 and b > 250:
                alpha = 0
            elif lum > 240:
                alpha = int(255 * (1.0 - (lum - 240) / 15.0))
            else:
                alpha = 255

            rgba[dst_idx] = r
            rgba[dst_idx + 1] = g
            rgba[dst_idx + 2] = b
            rgba[dst_idx + 3] = alpha

    return w, h, rgba

def resample_rgba(src_w, src_h, src_rgba, dst_w, dst_h):
    dst = bytearray(dst_w * dst_h * 4)
    for dy in range(dst_h):
        sy = dy * (src_h - 1) / max(1, (dst_h - 1))
        y0 = int(sy)
        y1 = min(y0 + 1, src_h - 1)
        fy = sy - y0

        for dx in range(dst_w):
            sx = dx * (src_w - 1) / max(1, (dst_w - 1))
            x0 = int(sx)
            x1 = min(x0 + 1, src_w - 1)
            fx = sx - x0

            w00 = (1 - fx) * (1 - fy)
            w10 = fx * (1 - fy)
            w01 = (1 - fx) * fy
            w11 = fx * fy

            i00 = (y0 * src_w + x0) * 4
            i10 = (y0 * src_w + x1) * 4
            i01 = (y1 * src_w + x0) * 4
            i11 = (y1 * src_w + x1) * 4

            r = int(src_rgba[i00] * w00 + src_rgba[i10] * w10 + src_rgba[i01] * w01 + src_rgba[i11] * w11)
            g = int(src_rgba[i00+1] * w00 + src_rgba[i10+1] * w10 + src_rgba[i01+1] * w01 + src_rgba[i11+1] * w11)
            b = int(src_rgba[i00+2] * w00 + src_rgba[i10+2] * w10 + src_rgba[i01+2] * w01 + src_rgba[i11+2] * w11)
            a = int(src_rgba[i00+3] * w00 + src_rgba[i10+3] * w10 + src_rgba[i01+3] * w01 + src_rgba[i11+3] * w11)

            out_i = (dy * dst_w + dx) * 4
            dst[out_i] = max(0, min(255, r))
            dst[out_i + 1] = max(0, min(255, g))
            dst[out_i + 2] = max(0, min(255, b))
            dst[out_i + 3] = max(0, min(255, a))

    return dst

def generate_app_icon(size, src_w, src_h, src_rgba, out_path):
    """
    Generates a premium PWA / iOS / Android app icon.
    Icon format:
    - Elegant rounded squircle base
    - Pure white badge with subtle drop-shadow & refined border
    - Centered official WYD Korea logo
    """
    pixels = bytearray(size * size * 4)
    r_corner = size * 0.223  # Apple/Android standard squircle radius
    cx, cy = size / 2.0, size / 2.0

    # Scale logo to fit nicely with comfortable padding inside the icon (approx 74% of icon size)
    logo_target_size = int(size * 0.76)
    scaled_logo = resample_rgba(src_w, src_h, src_rgba, logo_target_size, logo_target_size)
    logo_offset_x = (size - logo_target_size) // 2
    logo_offset_y = (size - logo_target_size) // 2

    for y in range(size):
        for x in range(size):
            idx = (y * size + x) * 4

            # Squircle clipping
            dx = max(0, abs(x - cx) - (cx - r_corner))
            dy = max(0, abs(y - cy) - (cy - r_corner))
            dist = math.sqrt(dx * dx + dy * dy)

            if dist > r_corner:
                pixels[idx:idx+4] = b'\x00\x00\x00\x00'
                continue

            alpha = 255
            if dist > r_corner - 1.5:
                alpha = int(255 * max(0, min(1, (r_corner - dist) / 1.5)))

            # Background: Crisp clean pure white with very subtle ambient vignette at edges
            # (Matches official WYD Korea visual identity)
            t = dist / r_corner
            bg_c = int(255 - t * 4)
            bg_r, bg_g, bg_b = bg_c, bg_c, bg_c

            # Subtle dark inner border
            if dist > r_corner - 3.0:
                bg_r = int(bg_r * 0.92)
                bg_g = int(bg_g * 0.92)
                bg_b = int(bg_b * 0.94)

            # Check if this pixel falls inside the centered logo
            lx = x - logo_offset_x
            ly = y - logo_offset_y

            if 0 <= lx < logo_target_size and 0 <= ly < logo_target_size:
                l_idx = (ly * logo_target_size + lx) * 4
                lr = scaled_logo[l_idx]
                lg = scaled_logo[l_idx + 1]
                lb = scaled_logo[l_idx + 2]
                la = scaled_logo[l_idx + 3] / 255.0

                # Alpha blend logo over background
                final_r = int(lr * la + bg_r * (1.0 - la))
                final_g = int(lg * la + bg_g * (1.0 - la))
                final_b = int(lb * la + bg_b * (1.0 - la))
            else:
                final_r, final_g, final_b = bg_r, bg_g, bg_b

            pixels[idx] = final_r
            pixels[idx + 1] = final_g
            pixels[idx + 2] = final_b
            pixels[idx + 3] = alpha

    write_png(out_path, size, size, pixels)
    print(f"Generated {out_path} ({size}x{size})")

def main():
    src_w, src_h, src_rgba = read_source_png('client/public/official_wyd_seoul.png')
    print(f"Loaded official logo: {src_w}x{src_h}")

    # 1. Save transparent logo
    write_png('client/public/logo-korea-transparent.png', src_w, src_h, src_rgba)
    print("Saved client/public/logo-korea-transparent.png")

    # 2. Generate high-res 512x512 and 192x192 app icons
    generate_app_icon(512, src_w, src_h, src_rgba, 'client/public/icon-512.png')
    generate_app_icon(192, src_w, src_h, src_rgba, 'client/public/icon-192.png')

    # 3. Generate icon.svg embedding the official logo
    with open('client/public/icon-512.png', 'rb') as f:
        png_bytes = f.read()
    import base64
    b64_png = base64.b64encode(png_bytes).decode('ascii')
    
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,{b64_png}" width="512" height="512" />
</svg>'''
    with open('client/public/icon.svg', 'w') as f:
        f.write(svg_content)
    print("Saved client/public/icon.svg")

if __name__ == '__main__':
    main()
