#!/usr/bin/env python3
"""Build clean night placeholders from the approved split night sample."""

from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
EGG_SOURCE = ROOT / "docs/visual-qa/egg-rotation-sample-warm-day/runtime-sample/clear-night-v2/normalized/egg_right_45.png"
SHADOW_SOURCE = ROOT / "miniprogram/assets/scenes/lifecycle/pre-hatch/30-character/egg/rotation-sample/clear-night-v2/egg_contact_shadow.webp"
NEST_SOURCE = ROOT / "miniprogram/assets/scenes/lifecycle/pre-hatch/20-room-objects/window-and-nest/rotation-sample/clear-night-v2/nest_pad.webp"
EGG_OUTPUT_ROOT = ROOT / "miniprogram/assets/scenes/lifecycle/pre-hatch/30-character/egg/season-weather"
NEST_OUTPUT_ROOT = ROOT / "miniprogram/assets/scenes/lifecycle/pre-hatch/20-room-objects/window-and-nest/season-weather"
NIGHT_KEYS = [
    "spring_clear_night",
    "summer_clear_night",
    "summer_storm_night",
    "autumn_clear_night",
    "winter_clear_night",
    "winter_snow_night",
]


def main() -> None:
    with Image.open(EGG_SOURCE) as egg_image, Image.open(SHADOW_SOURCE) as shadow_image:
        egg = egg_image.convert("RGBA")
        shadow = shadow_image.convert("RGBA").resize(egg.size, Image.Resampling.LANCZOS)
        merged = Image.alpha_composite(shadow, egg)

    with Image.open(NEST_SOURCE) as nest_image:
        nest = nest_image.convert("RGBA")

    for scene_key in NIGHT_KEYS:
        merged.save(EGG_OUTPUT_ROOT / f"{scene_key}_egg_right45.webp", format="WEBP", lossless=True, method=6)
        nest.save(NEST_OUTPUT_ROOT / f"{scene_key}_nest_pad.webp", format="WEBP", lossless=True, method=6)

    print(f"Updated {len(NIGHT_KEYS)} night placeholder pairs")


if __name__ == "__main__":
    main()
