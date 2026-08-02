#!/usr/bin/env python3
"""Build QA-only composites for the 20 pre-hatch season/weather layer sets."""

from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
BACKGROUND_ROOT = ROOT / "miniprogram/assets/scenes/lifecycle/pre-hatch/10-background/incubation-room/season-weather-full-scenes"
EGG_ROOT = ROOT / "miniprogram/assets/scenes/lifecycle/pre-hatch/30-character/egg/season-weather"
NEST_ROOT = ROOT / "miniprogram/assets/scenes/lifecycle/pre-hatch/20-room-objects/window-and-nest/season-weather"
OUTPUT_ROOT = ROOT / "docs/visual-qa/season-weather-layer-batch/previews"

SCENE_KEYS = [
    "spring_clear_day",
    "spring_clear_sunset",
    "spring_clear_night",
    "spring_cloudy_day",
    "spring_rain_day",
    "summer_clear_day",
    "summer_clear_sunset",
    "summer_clear_night",
    "summer_cloudy_day",
    "summer_storm_night",
    "autumn_clear_day",
    "autumn_clear_sunset",
    "autumn_clear_night",
    "autumn_rain_day",
    "winter_clear_day",
    "winter_clear_night",
    "winter_cloudy_day",
    "winter_snow_day",
    "winter_snow_night",
    "winter_post_snow_day",
]


def background_path(scene_key: str) -> Path:
    if scene_key == "spring_clear_night":
        return BACKGROUND_ROOT / "spring_clear_night_moonlight.webp"
    return BACKGROUND_ROOT / f"{scene_key}.webp"


def place_layer(canvas: Image.Image, source: Path, size: int, x: int, y: int) -> None:
    with Image.open(source) as layer_image:
        layer = layer_image.convert("RGBA").resize((size, size), Image.Resampling.LANCZOS)
        canvas.alpha_composite(layer, (x, y))


def build_preview(scene_key: str) -> Path:
    with Image.open(background_path(scene_key)) as background_image:
        canvas = background_image.convert("RGBA")

    width, height = canvas.size
    rpx = width / 750
    layer_size = round(500 * rpx)
    layer_x = round((width - layer_size) / 2)
    nest_y = round(height / 2 - 20 * rpx)
    egg_y = round(height / 2 - 190 * rpx)

    place_layer(canvas, NEST_ROOT / f"{scene_key}_nest_pad.webp", layer_size, layer_x, nest_y)
    place_layer(canvas, EGG_ROOT / f"{scene_key}_egg_right45.webp", layer_size, layer_x, egg_y)

    output = OUTPUT_ROOT / f"{scene_key}_composite_preview.png"
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(output, quality=95)
    return output


def main() -> None:
    outputs = [build_preview(scene_key) for scene_key in SCENE_KEYS]
    print(f"Built {len(outputs)} QA previews in {OUTPUT_ROOT}")


if __name__ == "__main__":
    main()
