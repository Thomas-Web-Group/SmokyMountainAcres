from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent
IMAGE_DIR = ROOT / "assets" / "img"

SOURCE_EXTENSIONS = {".njk", ".html", ".md", ".css", ".js", ".json"}
SKIP_DIRS = {"node_modules", "_site", ".git", ".venv"}

# Match image paths inside quoted strings, including spaces in filenames.
PATTERN = re.compile(
    r"""(?P<quote>["'])(?P<path>[^"'\r\n]*?\.(?:jpg|jpeg|png))(?P=quote)""",
    re.IGNORECASE,
)

apply_changes = "--apply" in sys.argv
changes = 0

for file_path in ROOT.rglob("*"):
    if not file_path.is_file():
        continue

    if any(part in SKIP_DIRS for part in file_path.relative_to(ROOT).parts):
        continue

    if file_path.suffix.lower() not in SOURCE_EXTENSIONS:
        continue

    text = file_path.read_text(encoding="utf-8")
    replacements = []

    def replace(match):
        global changes

        original = match.group("path")

        # Ignore external URLs and data URIs.
        if original.startswith(("http://", "https://", "data:")):
            return match.group(0)

        # Resolve paths relative to the project or source file.
        if original.startswith("/"):
            target = ROOT / original.lstrip("/")
        else:
            target = file_path.parent / original

        # Also handle asset paths written relative to the site root.
        if not target.exists() and original.startswith("assets/"):
            target = ROOT / original

        webp = target.with_suffix(".webp")

        if not webp.exists():
            return match.group(0)

        new_reference = str(Path(original).with_suffix(".webp")).replace("\\", "/")
        replacements.append((original, new_reference))
        changes += 1

        return f'{match.group("quote")}{new_reference}{match.group("quote")}'

    updated = PATTERN.sub(replace, text)

    if replacements:
        print(f"\n{file_path.relative_to(ROOT)}")

        for old, new in replacements:
            print(f"  {old}")
            print(f"  -> {new}")

        if apply_changes:
            file_path.write_text(updated, encoding="utf-8")

print(f"\n{changes} reference(s) found.")

if not apply_changes:
    print("DRY RUN ONLY - no files changed.")
    print("Run with --apply to make the changes.")
else:
    print("Changes applied.")