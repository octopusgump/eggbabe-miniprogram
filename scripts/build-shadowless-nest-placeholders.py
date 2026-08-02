#!/usr/bin/env python3
"""Remove the baked floor-shadow pixels from the approved placeholder pads."""

from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
DAY_SOURCE = ROOT / "docs/visual-qa/egg-rotation-sample-warm-day/runtime-sample/warm-day-v2/normalized/nest_pad.png"
OUTPUT_ROOT = ROOT / "miniprogram/assets/scenes/lifecycle/pre-hatch/20-room-objects/window-and-nest/season-weather"
NIGHT_KEYS = {
    "spring_clear_night",
    "summer_clear_night",
    "summer_storm_night",
    "autumn_clear_night",
    "winter_clear_night",
    "winter_snow_night",
}
SCENE_KEYS = [
    "spring_clear_day", "spring_clear_sunset", "spring_clear_night", "spring_cloudy_day", "spring_rain_day",
    "summer_clear_day", "summer_clear_sunset", "summer_clear_night", "summer_cloudy_day", "summer_storm_night",
    "autumn_clear_day", "autumn_clear_sunset", "autumn_clear_night", "autumn_rain_day",
    "winter_clear_day", "winter_clear_night", "winter_cloudy_day", "winter_snow_day", "winter_snow_night", "winter_post_snow_day",
]


def shadowless(source: Path) -> Image.Image:
    pixels = np.array(Image.open(source).convert("RGBA"), dtype=np.uint8)
    red = pixels[:, :, 0].astype(np.int16)
    green = pixels[:, :, 1].astype(np.int16)
    blue = pixels[:, :, 2].astype(np.int16)
    alpha = pixels[:, :, 3]

    # The textile is warm camel/orange; the generated floor shadow is near-black and neutral.
    # Close the dense textile-color mask so dark yarn grooves remain opaque while the external halo is removed.
    textile_seed = (alpha > 8) & (red > 62) & ((red - green) > 22) & ((red - blue) > 38)
    textile_mask = Image.fromarray((textile_seed * 255).astype(np.uint8), "L")
    textile_mask = textile_mask.filter(ImageFilter.MaxFilter(15))
    textile_mask = textile_mask.filter(ImageFilter.MinFilter(15))
    textile_mask = textile_mask.filter(ImageFilter.MaxFilter(7))
    keep = np.array(textile_mask) > 0
    pixels[:, :, 3] = np.where(keep, alpha, 0).astype(np.uint8)
    return Image.fromarray(pixels, "RGBA")


def night_grade(source: Image.Image) -> Image.Image:
    pixels = np.array(source.convert("RGBA"), dtype=np.float32)
    pixels[:, :, 0] = pixels[:, :, 0] * 0.50 + 18
    pixels[:, :, 1] = pixels[:, :, 1] * 0.62 + 18
    pixels[:, :, 2] = pixels[:, :, 2] * 0.85 + 24
    return Image.fromarray(np.clip(pixels, 0, 255).astype(np.uint8), "RGBA")


def main() -> None:
    day = shadowless(DAY_SOURCE)
    night = night_grade(day)
    for scene_key in SCENE_KEYS:
        image = night if scene_key in NIGHT_KEYS else day
        image.save(OUTPUT_ROOT / f"{scene_key}_nest_pad.webp", format="WEBP", lossless=True, method=6)
    print(f"Updated {len(SCENE_KEYS)} shadowless nest placeholders")


if __name__ == "__main__":
    main()
