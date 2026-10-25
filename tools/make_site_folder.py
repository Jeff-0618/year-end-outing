#!/usr/bin/env python3
"""
Builds the small folder you upload to GitHub:   site-to-upload/

  python tools/make_site_folder.py

It contains ONLY what the website needs (about 15 files instead of hundreds):
  index.html        the whole site in one file (programs, places, Chinese text, styles)
  config.js         Google sign-in / Google Sheet settings, number of people
  prices.js         the prices
  user-photos.js    the list of photos you added
  assets/user-photos/<place>/...   your own photos

Upload the CONTENTS of site-to-upload/ to the top level of your GitHub repository
(Add file > Upload files; drag everything inside the folder). Same-name files are replaced.
Photos from Airbnb and the official sites are NOT copied: the site shows them from their original links.
"""
import re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "site-to-upload"


def read(p):
    return (ROOT / p).read_text(encoding="utf-8")


def main():
    css, data, zh, app, html = read("styles.css"), read("data/properties.js"), read("data/zh.js"), read("app.js"), read("index.html")
    for name, s in (("styles.css", css), ("data/properties.js", data), ("data/zh.js", zh), ("app.js", app)):
        if "</script" in s.lower() or "</style" in s.lower():
            sys.exit("Cannot bundle: %s contains a closing script/style tag." % name)
    html = html.replace('<link rel="stylesheet" href="styles.css?v=2">', "<style>\n" + css + "\n</style>")
    a = html.index('  <script src="config.js?v=2"></script>')
    b = html.index("</body>")
    tail = ('  <script src="config.js?v=2"></script>\n  <script src="user-photos.js?v=2"></script>\n  <script src="prices.js?v=2"></script>\n'
            "  <script>\n" + data + "\n  </script>\n  <script>\n" + zh + "\n  </script>\n  <script>\n" + app + "\n  </script>\n"
            "  <script>\n    setTimeout(function () {\n      var v = document.getElementById('view'), nav = document.getElementById('nav');\n"
            "      if (!v || (v.innerHTML.trim() && nav && nav.innerHTML.trim())) return;\n"
            "      v.innerHTML = '<div style=\"padding:20px;font:16px/1.6 system-ui;max-width:560px\"><h2>The page did not start<br>页面没有启动</h2><p>Please upload the new <b>index.html</b> again (top level of the site) and refresh twice.<br>请重新上传新的 <b>index.html</b>（放在网站最外层），然后刷新两次。</p></div>';\n"
            "    }, 2500);\n  </script>\n")
    html = html[:a] + tail + html[b:]
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    (OUT / "index.html").write_text(html, encoding="utf-8")
    for f in ("config.js", "prices.js", "user-photos.js"):
        shutil.copyfile(ROOT / f, OUT / f)
    photos = ROOT / "assets" / "user-photos"
    count = 0
    if photos.exists():
        for f in sorted(photos.rglob("*")):
            if f.is_file() and f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
                target = OUT / f.relative_to(ROOT)
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(f, target)
                count += 1
    files = [f for f in OUT.rglob("*") if f.is_file()]
    size = sum(f.stat().st_size for f in files) / 1e6
    print("Built %s" % OUT)
    print("  %d files, %.1f MB  (4 web files + %d of your photos)" % (len(files), size, count))
    if len(files) > 90:
        print("  More than 90 files: upload in two batches (GitHub allows 100 per upload).")
    print("Upload everything INSIDE site-to-upload/ to the top level of your GitHub repository.")


if __name__ == "__main__":
    main()
