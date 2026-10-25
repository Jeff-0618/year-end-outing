#!/usr/bin/env python3
"""
Add your own photos to the website — you never need to send them to anyone.

HOW
  1. Put photos of a place into its folder inside   photos-to-add/<place-id>/
     (any file names; .jpg .jpeg .png .webp).  Each folder has an _ABOUT.txt that says which place it is.
  2. Run, in the project folder:        python tools/add_photos.py
  3. Upload the folder  assets/user-photos/  and the file  user-photos.js  to the website (GitHub).

WHAT IT DOES
  * Shrinks each photo to at most 1600 px and saves it as .jpg in  assets/user-photos/<place-id>/
  * Removes hidden data such as GPS location (needs Pillow:  pip install pillow ; without it the photo is copied as is)
  * Never adds the same photo twice (you can run it again whenever you add more)
  * Writes user-photos.js, the list the website reads

OTHER COMMANDS
  python tools/add_photos.py --links     list every place with its folder name, links and photo counts
"""
import hashlib, json, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / "photos-to-add"
OUT = ROOT / "assets" / "user-photos"
MANIFEST = ROOT / "user-photos.js"
IMG = {".jpg", ".jpeg", ".png", ".webp"}


def load_data():
    text = (ROOT / "data" / "properties.js").read_text(encoding="utf-8")
    marker = "\nwindow.PROPERTIES_DATA ="
    return json.loads(text[text.index(marker) + len(marker):].strip().rstrip(";"))


def images_in(folder):
    return sorted([f for f in folder.iterdir() if f.is_file() and f.suffix.lower() in IMG], key=lambda f: f.name.lower()) if folder.exists() else []


def write_manifest(places):
    listed = {}
    for p in places:
        used = {Path(ph["src"]).name for ph in p["photos"] if "src" in ph}      # photos already named in properties.js
        files = [f.name for f in images_in(OUT / p["id"]) if f.name not in used]
        if files:
            listed[p["id"]] = files
    body = "/* Written by tools/add_photos.py. Lists the photos you added in assets/user-photos/<place-id>/. */\n"
    body += "window.USER_PHOTOS = " + json.dumps(listed, indent=1, ensure_ascii=False) + ";\n"
    MANIFEST.write_text(body, encoding="utf-8")
    return listed


def show_links(places):
    for p in places:
        mine = len(images_in(OUT / p["id"]))
        print("%-14s %s" % (p["id"], p["name"]))
        print("               %s | official photos in data: %d | your photos: %d" % (p["region"], sum(1 for ph in p["photos"] if "remote" in ph), mine))
        for l in p["links"]:
            print("               %s: %s" % (l["label"], l["url"]))


def main():
    data = load_data()
    places = data["properties"]
    ids = {p["id"] for p in places}
    if "--links" in sys.argv:
        show_links(places)
        return
    try:
        from PIL import Image, ImageOps
    except ImportError:
        Image = None
        print("Note: Pillow is not installed, so photos are copied as they are (large, and with location data).")
        print("      For smaller files without GPS data run:  pip install pillow   and run this again.\n")
    added = skipped = 0
    INBOX.mkdir(exist_ok=True)
    for folder in sorted(INBOX.iterdir()):
        if not folder.is_dir():
            continue
        if folder.name not in ids:
            print("Skipping folder '%s': not a place id (see --links)" % folder.name)
            continue
        dest_dir = OUT / folder.name
        dest_dir.mkdir(parents=True, exist_ok=True)
        existing = [f.name for f in dest_dir.iterdir() if f.is_file()]
        for src in images_in(folder):
            digest = hashlib.sha1(src.read_bytes()).hexdigest()[:8]
            if any(digest in name for name in existing):
                skipped += 1
                continue
            number = 1 + max([int(m.group(1)) for m in (re.match(r"(\d+)_", n) for n in existing) if m] or [0])
            name = "%02d_%s.jpg" % (number, digest)
            target = dest_dir / name
            try:
                if Image:
                    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
                    im.thumbnail((1600, 1600))
                    im.save(target, "JPEG", quality=82, optimize=True)      # no EXIF is written: location data is gone
                elif src.suffix.lower() in (".jpg", ".jpeg"):
                    shutil.copyfile(src, target)
                else:
                    print("  cannot use %s without Pillow (png/webp)" % src.name)
                    continue
            except Exception as e:                                          # broken or unsupported file
                print("  could not read %s: %s" % (src.name, e))
                continue
            existing.append(name)
            added += 1
            print("  added  %-14s %s -> %s" % (folder.name, src.name, name))
    listed = write_manifest(places)
    print("\nDone. added: %d, already there: %d. Places with your photos: %s" % (added, skipped, ", ".join("%s (%d)" % (k, len(v)) for k, v in listed.items()) or "none yet"))
    print("Now upload the folder  assets/user-photos/  and the file  user-photos.js  to the website.")


if __name__ == "__main__":
    main()
