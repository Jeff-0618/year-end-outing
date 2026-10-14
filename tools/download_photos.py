#!/usr/bin/env python3
"""
Optional helper: save every photo listed in data/properties.js onto this computer.

Run it once while you have internet (before the presentation):
    python tools/download_photos.py

Photos go to  assets/images/<property-id>/<original file name>  (the file name is
taken from the photo's official URL, so adding or reordering photos in
data/properties.js never mixes them up). The web page tries these local files
first, so the presentation also works if the venue Wi-Fi is bad.

Options:  --force   download again even if the file already exists
Only the standard library is used (no pip install needed).
"""
import json, pathlib, re, sys, time, urllib.parse, urllib.request, urllib.error

ROOT = pathlib.Path(__file__).resolve().parent.parent
FORCE = "--force" in sys.argv


def load():
    text = (ROOT / "data" / "properties.js").read_text(encoding="utf-8")
    marker = "\nwindow.PROPERTIES_DATA ="
    body = text[text.index(marker) + len(marker):].strip().rstrip(";")
    return json.loads(body)


def base_name(url):
    # must match baseName() in app.js
    name = urllib.parse.unquote(url.split("?")[0].rsplit("/", 1)[-1])
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)


def candidates(url):
    # Airbnb image URLs accept a width parameter; try the larger one first.
    if "muscache.com" in url:
        return [url + "?im_w=1200", url + "?im_w=720", url]
    return [url]


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (countdown2026 photo helper)"})
    with urllib.request.urlopen(req, timeout=25) as r:
        data = r.read()
        ctype = r.headers.get("Content-Type", "")
    if not ctype.startswith("image/") or len(data) < 2000:
        raise ValueError("not an image (%s, %d bytes)" % (ctype, len(data)))
    return data


def main():
    data = load()
    ok = skipped = failed = 0
    for prop in data["properties"]:
        folder = ROOT / "assets" / "images" / prop["id"]
        folder.mkdir(parents=True, exist_ok=True)
        for i, photo in enumerate(prop["photos"], start=1):
            if "remote" not in photo:      # your own photos (with "src") are left alone
                continue
            dest = folder / base_name(photo["remote"])
            if dest.exists() and not FORCE:
                skipped += 1
                continue
            for url in candidates(photo["remote"]):
                try:
                    dest.write_bytes(fetch(url))
                    ok += 1
                    print("saved   %s/%s  (%s)" % (prop["id"], dest.name, photo["caption"]))
                    break
                except (urllib.error.URLError, ValueError, OSError) as e:
                    last = e
            else:
                failed += 1
                print("FAILED  %s/%s  %s  -> %s" % (prop["id"], dest.name, photo["caption"], last))
            time.sleep(0.25)
    print("\nDone. saved: %d, already there: %d, failed: %d" % (ok, skipped, failed))
    if failed:
        print("Failed photos still show from the web when online; otherwise a clear placeholder is shown.")


if __name__ == "__main__":
    main()
