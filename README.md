# 年终倒数 2026 · 住宿地图（第 2 版初版）

出发点：**FGA CYC Kuchai Lama**。网页上有 9 个场地，按离教会的距离排列，点进去看资料，可以按赞、选“第一选择”、提问，随时切换中文／英文。

## 1. 这一版有什么

- **场地**（首页）：手机单列卡片，只显示照片、名字、地区、离教会多远、价格、人数、♥ 票数。顶部可以按“近 / 中等 / 远”筛选，也可以只看有泳池／BBQ／卡拉 OK 的。
- **地图**：教会在中间，虚线圈是 50、100、200 公里。圆点上的数字就是场地编号（和首页卡片的号码一样），颜色表示远近：绿＝近（≤50 公里）、黄＝中等、红＝远（>100 公里）。点圆点会弹出小卡片，有“详情”和“导航”。
- **详情**：大图可左右滑、价格、人数、床和浴室、优点、注意事项、重点设施，更多资料收在折叠区里。每个场地都有“从教会导航”按钮，打开 Google Maps 会直接显示车程。
- **对比**：在最多 3 个场地上点天平图标，再到“对比”页并排看。输入人数，会自动算每人费用。
- **投票**：每个场地可以按 ♥，也可以“投一票给这里”（每人一票）。**首页顶部**显示大家的投票结果。
- **分享**：每个场地有分享按钮，给出的是**真正的地点链接**（Airbnb、官网或 Google 地图），可以复制或直接发 WhatsApp，对方打开就是那个地点。
- **提问**：每个场地底部可以留言提问，不开放自由发帖。
- **登录**：大家用 Google 账号登录后才能点赞、投票、提问，名字来自 Google，你的表格里能看到是谁。
- **中 / EN**：右上角，每一页都有，会记住你的选择。

## 2. 上传到 GitHub / Vercel：只传一个小文件夹（约 14 个文件）

**为什么之前会“放不完”**：网页版 GitHub 一次最多收 100 个文件，而项目里有很多只在电脑上用的东西（`tools`、`data`、`photos-to-add`，还有如果运行过 `download_photos.py` 会多出上百张官方照片）。**网站其实只需要下面这几个文件。**

在项目文件夹打开 PowerShell，运行：

```
python tools/make_site_folder.py
```

它会生成 **`site-to-upload`** 文件夹，里面只有：

- `index.html`（整个网站，一个文件）
- `config.js`（Google 登录／表格设置）
- `prices.js`（价格）
- `user-photos.js`（你加的照片清单）
- `assets/user-photos/…`（你自己的照片，目前是 Dusun Bonda 的 10 张）

**上传**：打开 GitHub 仓库首页（最外层）→ **Add file → Upload files** → 把 `site-to-upload` **里面的所有东西**拖进去 → **Commit changes**。同名文件会被替换。等约 30 秒，打开网址，刷新两次，页面最底下有一行小字 `v2.1 · 9 个场地` 就表示新版生效了。

**只改了一两样时**，只传那一两个文件就行：改价格只传 `prices.js`；改 Google 设置只传 `config.js`；其余不用动。

**官方照片（Airbnb 和官网）不用下载、不用上传**：网站直接从原来的链接显示。**请不要运行 `download_photos.py`**（它会产生上百个文件，正是上传不完的原因）。仓库里已经有的旧文件（`app.js`、`styles.css`、`data/…`、`assets/images/…`）可以留着，新版不会用到，也可以在 GitHub 上删掉。

**如果页面是空白，或者出现“有文件缺少或还是旧版”**：说明网站上还是旧的 `index.html`，或上传放错了位置。重新上传 `index.html` 到最外层即可。

**GitHub 网页还是不让你传？** 换个办法，不用 GitHub 网页：在 VS Code 里打开 `site-to-upload` 文件夹，用左边的“源代码管理”按钮提交并推送；或者在这个文件夹里运行 `npx vercel --prod` 直接上传到 Vercel。

## 3. 加你自己的照片（不用发给我）

每个场地有一个专属文件夹：`photos-to-add/<场地代号>/`，里面的 `_ABOUT.txt` 写着这是哪个场地。

1. 把这个场地的照片放进对应文件夹（文件名随意，`.jpg` `.jpeg` `.png` `.webp` 都可以）。**要放真正的照片文件**：在照片上右键 →“图片另存为…”，或者截图。如果存下来的是“网页”（文件名结尾是 `.html`、`.htm`，或者图标是浏览器图标），脚本会提示“这是网页不是照片”并跳过。
2. 在项目文件夹打开 PowerShell，运行：
   ```
   pip install pillow          （只需要一次，用来缩小照片、去掉照片里的定位信息）
   python tools/add_photos.py
   python tools/make_site_folder.py
   ```
3. 上传 `site-to-upload` 里面的东西（见第 2 节）。刷新网页，照片会排在最前面，标成“我们的照片 1、2、3…”。

脚本会把照片缩到最长边 1280 像素，存成 `.jpg`（每张大约 100–300 KB），所以文件很小；同一张照片重复放不会加两次，随时可以再放新照片再运行一次。每个场地建议 3–6 张就够了。想看每个场地的代号和链接：`python tools/add_photos.py --links`。`photos-to-add` 里的原图不用上传。

**目前没有照片的场地（可以先去下载）：**

| 文件夹代号 | 场地 | 链接 |
|---|---|---|
| `hh_melaka` | H&H Leisure Guest House（马六甲） | https://maps.app.goo.gl/Ey9QVeVGdUK6wZyV7?g_st=aw |
| `gm_pool_pd` | GM Pool Villa Port Dickson | https://share.google/PLnzDCD4DBzlIpwTO |

其他场地已经有 Airbnb 或官网的照片，也可以再往它们的文件夹里加。想让你的照片排在 Airbnb 照片后面，把 `config.js` 里的 `userPhotosFirst` 改成 `false`。

## 4. Google 登录 + Google 表格

完整的一步一步教程在 **GOOGLE-SHEET-SETUP.md**（约 20 分钟，不用付费）。做完之后：

- 大家用 **Google 账号登录**，才能点赞、投票、提问。登出再登入、换手机，记录都还在。
- 每个场地底下可以按 ♥、**投一票给这里**（每人一票，可以改票）、提问；首页顶部的“大家的投票”所有人都看得到。
- 你的表格里有 **Votes**（谁投了什么，含名字和邮箱）、**Results**（每个场地的票数、赞数、谁投的）、**Questions**（场地名、名字、问题，在 Reply 格子写回复）。
- 没连接之前，投票和提问只存在各自的手机里。只填 `sheetUrl` 不填 `googleClientId` 时，改为“第一次输入名字”的方式。

## 5. 你可以自己改的地方

- **价格**：只改最外层的 `prices.js`。每个场地一行，例如 `"pd_pool": { "night": 2100 }` 表示整间一晚 RM2,100（gross）；按人收费的写 `{ "perPerson": [100, 120] }`；还不知道就写 `{ "night": null }`。可以加一句备注：`{ "night": 2100, "note": "31 Dec, 20 guests" }`。在 GitHub 上点开 `prices.js` → 铅笔图标 → 改数字 → Commit 就行，手机也可以。
- 人数：`data/config.js` 里的 `"participants": 20`，对比页会自动用它算每人费用。
- 加新场地：复制 `properties.js` 里最后一个场地的结构，填上名字、坐标、链接即可（坐标没有就先用城镇中心）。中文文字加在 `data/zh.js`，没写的会自动显示英文。
- 不要运行 `tools/download_photos.py`：它会下载上百张官方照片，文件太多，GitHub 网页放不下，而且网站不需要它。
- 自己的照片：见第 3 节。

## 6. 场地和还缺什么

**目前网站上的 9 个场地**：A Genting、B Puchong、C Kajang、Dusun Bonda、Port Dickson（PD4R3BR）、Batu Gajah（Royale Villa）、Bentong（ActB）、H&H Leisure Guest House（马六甲）、GM Pool Villa（波德申）。

**已经拿掉的 5 个**（你问过了）：
- 订不到：E & J Sweet Home（Tanjong Sepat）、Sunrise Villa（Genting Sempah）、The Silver House（Janda Baik）、Memories Homestay 4（Alor Gajah，7 房 26 人，最多 40 人）。
- 超出预算：Bird of Paradise Villa（Genting Sempah）。
资料备份在 `tools/removed-places.json`，以后哪一间又有了，可以把它的内容贴回 `data/properties.js`。

**资料比较完整（Airbnb 页面读到的）**：A、B、C、Port Dickson、Batu Gajah、Bentong、Dusun Bonda。
**只有名字和地址（来自 Google 链接，没有价格、床位、照片）**：H&H Leisure Guest House、GM Pool Villa（Google 不让我读取分享链接，只拿到名字）。
**价格**：只有 A、B、C 和 Dusun Bonda 有价格（你给的），其余是“价格待确认”，改 `prices.js` 即可。

**位置与距离**：所有场地的位置只到城镇／区域级（网页上写了“大概位置”）。教会的位置也是 Kuchai Lama 区域级。距离是直线距离，**不是车程**，真正车程请点“从教会导航”看 Google Maps。

## 7. 测试情况

在无头 Chromium 里测试（我这边没有外网）：59 项页面测试、28 项登录流程测试、30 项表格脚本测试通过（多文件版和单文件版各测一遍）；投票脚本 14 项通过。包括：14 个场地的距离和独立算法一致、距离分组、筛选、中英切换、每个场地的详情页、你的 10 张照片能加载、♥／第一选择／提问、对比页每人费用、地图标记和弹出卡片（用模拟地图库）、地图载入失败时的按距离清单，以及**用真正的 Google Apps Script 代码模拟两部手机共用同一张表格**（点赞、第一选择、提问、你在表格里写的回复能显示回来）。

**没有测试到的**：真实的地图底图和 Leaflet 库、Airbnb／官网照片的实际显示、真正部署到你的 Google 账号后的投票和提问（授权步骤我没法代你做）、真机触摸。上传后请用手机点一遍，并让朋友点个赞试试。
