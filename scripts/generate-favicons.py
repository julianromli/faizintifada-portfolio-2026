from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SOURCE = PUBLIC / "favicon.png"


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGBA")

    for name, size in {
        "favicon-16x16.png": 16,
        "favicon-32x32.png": 32,
        "apple-touch-icon.png": 180,
    }.items():
        source.resize((size, size), Image.Resampling.LANCZOS).save(PUBLIC / name)

    icon_16 = source.resize((16, 16), Image.Resampling.LANCZOS)
    icon_32 = source.resize((32, 32), Image.Resampling.LANCZOS)
    icon_16.save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32)],
        append_images=[icon_32],
    )


if __name__ == "__main__":
    main()
