from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent
IMAGE_DIR = ROOT / "assets" / "img"
BACKUP_DIR = ROOT.parent / "SmokyMountainAcres-Originals"

EXTENSIONS = {".jpg", ".jpeg", ".png"}

moved = 0
skipped = 0

for image_path in IMAGE_DIR.rglob("*"):
    if not image_path.is_file():
        continue

    if "icons" in image_path.relative_to(IMAGE_DIR).parts:
        continue

    if image_path.suffix.lower() not in EXTENSIONS:
        continue

    webp_path = image_path.with_suffix(".webp")

    if not webp_path.exists():
        skipped += 1
        continue

    relative_path = image_path.relative_to(IMAGE_DIR)
    backup_path = BACKUP_DIR / relative_path

    # Never overwrite an existing backup.
    if backup_path.exists():
        print(f"SKIPPED - backup already exists: {backup_path}")
        skipped += 1
        continue

    backup_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(image_path), str(backup_path))

    print(f"MOVED: {relative_path}")
    moved += 1

print(f"\nMoved: {moved}")
print(f"Skipped: {skipped}")
print(f"Backup: {BACKUP_DIR}")