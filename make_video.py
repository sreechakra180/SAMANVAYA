"""
Generate a 30-second animated video showing how computers are used in daily life.
Uses PIL for images, cv2/numpy for processing, moviepy for compositing.
"""

import os
import math
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import cv2

OUTPUT_DIR = r"D:\all projects\mitigata hackathon\output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

WIDTH, HEIGHT = 1280, 720  # 16:9
FPS = 24
TOTAL_SECONDS = 30
BG_COLOR = (15, 15, 35)          # dark navy background
WHITE = (240, 240, 245)
ACCENT_BLUE = (70, 150, 255)
ACCENT_CYAN = (80, 220, 230)
ACCENT_PURPLE = (180, 120, 255)
ACCENT_ORANGE = (255, 170, 80)
ACCENT_GREEN = (80, 230, 130)
GOLD = (255, 200, 60)

def load_font(size, bold=False):
    candidates = [r"C:\Windows\Fonts\msyhbd.ttc", r"C:\Windows\Fonts\msyh.ttc",
                  r"C:\Windows\Fonts\arial.ttf", r"C:\Windows\Fonts\Arial Bold.ttf"]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size, index=0 if bold else 0)
            except Exception:
                pass
    return ImageFont.load_default()

def make_bg(w, h):
    img = Image.new("RGB", (w, h), BG_COLOR)
    draw = ImageDraw.Draw(img)
    cx, cy = w // 2, h // 2
    max_dist = int(math.hypot(cx, cy))
    for r in range(max_dist, 0, -4):
        t = max(0.0, 1.0 - r / max_dist) * 0.35
        col = tuple(int(c * t) for c in BG_COLOR[::-1])
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
    return img

def draw_text(img, text, pos, font, color=WHITE, anchor="lt"):
    txt = Image.new("RGB", img.size, (0, 0, 0))
    ImageDraw.Draw(txt).text(pos, text, font=font, fill=color, anchor=anchor)
    if isinstance(img, np.ndarray):
        img = Image.fromarray(img)
    if img.mode == "RGBA":
        img.paste(txt, (0, 0), txt if txt.mode == "RGBA" else None)
    else:
        img.paste(txt, (0, 0))
    return np.array(img)[:, :, :3].astype(np.uint8)

def draw_glow(img, text, pos, font, glow_color, glow_radius=4, glow_offset=3, anchor="lt"):
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    for offset in range(-glow_offset, glow_offset + 1):
        odraw.text((pos[0] + offset, pos[1]), text, font=font,
                   fill=(*glow_color, 80), anchor=anchor)
    img.paste(overlay, (0, 0))
    draw_text(img, text, pos, font, WHITE, anchor=anchor)

def render_scene_1(t):
    """Title scene: 'How Computers Are Used' — t from 0 to ~6 sec."""
    progress = min(max(t / 6.0, 0.0), 1.0)
    w, h = WIDTH, HEIGHT
    img = make_bg(w, h).convert("RGBA")
    a = int(progress * 230)
    img.paste(Image.new("RGBA", (w, h), (*BG_COLOR, a)), (0, 0))

    cy = h // 2
    draw_text(img, "HOW COMPUTERS ARE USED", (w // 2, cy - 120), load_font(72, True), WHITE, anchor="mt")
    draw_text(img, "Every day, millions of people rely on computers to ...", (w // 2, cy - 50), load_font(36), ACCENT_BLUE, anchor="mt")
    draw_text(img, "... connect, create, and explore the world.", (w // 2, cy + 10), load_font(36), ACCENT_CYAN, anchor="mt")

    # Decorative ring of small dots
    dot_x, dot_y = w // 2, cy + 100
    radius = 230
    for i in range(12):
        angle = math.radians(-90 + i * 30)
        d = int(radius * 0.55)
        dx = dot_x + int(d * math.cos(angle))
        dy = dot_y + int(d * math.sin(angle))
        draw_glow(img, "•", (dx, dy), load_font(28, False), ACCENT_BLUE, glow_radius=2, glow_offset=1)

    return np.array(img)[:, :, :3].astype(np.uint8)

def render_scene_2(t, title, lines, accent_color, progress=None):
    """General content scene with animated subtitle cards."""
    if progress is None:
        # Default: animate fade-in based on time since title card
        if t < 6:
            progress = min(t / 6.0, 1.0)
        else:
            elapsed = t - 6
            progress = min(elapsed / 4.0, 1.0)

    w, h = WIDTH, HEIGHT
    img = make_bg(w, h).convert("RGBA")
    a = int(min(progress * 1.8, 1.0) * 255)
    img.paste(Image.new("RGBA", (w, h), (*BG_COLOR, a)), (0, 0))

    cy = h // 2
    title_alpha = int(min(progress * 1.5, 1.0))
    body_alpha = int(min(max((progress - 0.4) / 0.4, 0.0), 1.0) * 255)

    # Title card
    draw_glow(img, title, (w // 2, cy - 140), load_font(64, True),
              accent_color, glow_radius=5, glow_offset=4)

    # Body text below
    card_y = cy - 40
    card_h = h - card_y - 60
    card_pad = 40
    lines_drawn = []
    line_h = 52
    total_h = len(lines) * line_h + card_pad * 2
    start_y = cy - total_h // 2 + line_h // 2

    current_y = start_y
    for line in lines:
        bg_alpha = int(min(progress * 1.2, 1.0) * 110)
        bg_box = (card_pad, current_y - line_h // 2, w - card_pad, current_y + line_h // 2)
        bg_img = Image.new("RGBA", (w, h), (*BG_COLOR, bg_alpha))
        card_tmp = Image.alpha_composite(img, bg_img).convert("RGB")
        img = card_tmp

        draw_text(img, line, (w // 2, current_y), load_font(28, False), ACCENT_CYAN, anchor="mt")
        lines_drawn.append(current_y)
        current_y += line_h

    return np.array(img)[:, :, :3].astype(np.uint8)

# ---------------------------------------------------------------------------
# Scene definitions
# ---------------------------------------------------------------------------
scenes_data = [
    {
        "start": 5.0, "dur": 4.0, "title": "CONNECTING PEOPLE",
        "lines": ["Email messages cross oceans in seconds.", "Social media keeps families apart yet together.", "Online meetings connect teams worldwide."],
        "ic": ACCENT_BLUE, "ac": ACCENT_CYAN,
    },
    {
        "start": 9.0, "dur": 4.0, "title": "CREATING EVERYTHING",
        "lines": ["Writers draft stories and articles.", "Designers craft logos and products.", "Musicians compose tracks online."],
        "ic": ACCENT_PURPLE, "ac": ACCENT_GREEN,
    },
    {
        "start": 13.0, "dur": 4.0, "title": "LEARNING AND WORKING",
        "lines": ["Students attend virtual classes.", "Doctors read patient records.", "Engineers simulate designs."],
        "ic": ACCENT_ORANGE, "ac": GOLD,
    },
    {
        "start": 17.0, "dur": 6.0, "title": "STREAMING & GAMING",
        "lines": ["You watch movies live.", "You listen to music anywhere.", "You play games on powerful GPUs."],
        "ic": ACCENT_BLUE, "ac": ACCENT_PURPLE,
    },
    {
        "start": 23.0, "dur": 7.0, "title": "YOUR COMPUTER IS YOUR PORTAL",
        "lines": ["It lets you learn new skills.", "It stores your memories.", "It powers the future."],
        "ic": ACCENT_CYAN, "ac": ACCENT_BLUE,
    },
]

# ---------------------------------------------------------------------------
# Render all frames
# ---------------------------------------------------------------------------
all_frames = []
for f_idx in range(TOTAL_SECONDS * FPS):
    t = f_idx / FPS
    if t < scenes_data[0]["start"]:
        frame = render_scene_1(t)
    else:
        # find active scene
        active = None
        for s in scenes_data:
            if s["start"] <= t < s["start"] + s["dur"]:
                active = s
                break
        if active is None:
            active = scenes_data[-1]
        elapsed = t - active["start"]
        frame = render_scene_2(t, active["title"], active["lines"], active["ac"], elapsed / active["dur"])
    all_frames.append(frame)

print(f"Generated {len(all_frames)} frames")

# Preview first few frames
for i in range(5):
    cv2.imwrite(os.path.join(OUTPUT_DIR, f"preview_{i}.png"), all_frames[i])

# ---------------------------------------------------------------------------
# Build video
# ---------------------------------------------------------------------------
from moviepy import VideoClip, concatenate_videoclips

clips = []
current = None

for f_idx in range(TOTAL_SECONDS * FPS):
    t = f_idx / FPS
    if t < scenes_data[0]["start"]:
        clip = VideoClip(lambda t=t: all_frames[t], fps=FPS, is_image=True)
        current = clip
    else:
        active = None
        for s in scenes_data:
            if s["start"] <= t < s["start"] + s["dur"]:
                active = s
                break
        if active is None:
            active = scenes_data[-1]
        clip = render_scene_2(t, active["title"], active["lines"], active["ac"],
                              t - active["start"])
        if current is None:
            current = clip
        else:
            current = concatenate_videoclips([current, clip])
    clips.append(current)
    if (f_idx + 1) % 100 == 0:
        print(f"  Frame {f_idx+1}/{TOTAL_SECONDS*FPS}")

print("Concatenating video...")
final = concatenate_videoclips(clips, method="compose")

out_path = os.path.join(OUTPUT_DIR, "computer_uses_video.mp4")
print(f"Writing {out_path}...")
final.write_videofile(
    out_path,
    fps=FPS,
    codec="libx264",
    audio=False,
    preset="medium",
    threads=2,
)
print(f"Done! Output: {out_path}")
print(f"Output exists: {os.path.exists(out_path)} ({os.path.getsize(out_path)//1024} KB)")
