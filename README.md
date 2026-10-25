# 年终倒数 2026 · 住宿地图（第 2 版初版）

出发点：**FGA CYC Kuchai Lama**。网页上有 14 个场地，按离教会的距离排列，点进去看资料，可以按赞、选“第一选择”、提问，随时切换中文／英文。

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

## 2. 上传到 GitHub / Vercel

**更新网页程序（只传 1 个文件）**：用单文件版 `index.html`（里面已经包含全部程序、资料和中文）。

1. 把 `index.html` 下载到手机或电脑。
2. 打开 GitHub 仓库首页（最外层），点 **Add file → Upload files**，选 `index.html`，点 **Commit changes**（同名文件会被替换）。
3. 等约 30 秒，打开网址，刷新两次。页面最底下有一行小字 `v2.1 · 14 个场地`，看到它就表示新版已经生效。

仓库里原来的 `app.js`、`styles.css`、`data/…` 可以留着，新版不会用到。

**如果页面是空白，或者出现“有文件缺少或还是旧版”**：说明网站上还是旧的 `index.html`，或者上传放错了位置。重新上传 `index.html` 到最外层即可。

**其他三个小文件也放最外层（和 `index.html` 放一起）**：`prices.js`（价格，见第 5 节）、`config.js`（填 Google Sheet 网址、人数）和 `user-photos.js`（你加的照片清单，第 3 节会自动生成）。

## 3. 加你自己的照片（不用发给我）

每个场地有一个专属文件夹：`photos-to-add/<场地代号>/`，里面的 `_ABOUT.txt` 写着这是哪个场地。

1. 把这个场地的照片放进对应文件夹（文件名随意，`.jpg` `.jpeg` `.png` `.webp` 都可以）。
2. 在项目文件夹打开 PowerShell，运行：
   ```
   pip install pillow          （只需要一次，用来缩小照片、去掉照片里的定位信息）
   python tools/add_photos.py
   ```
3. 把 `assets/user-photos` 文件夹和 `user-photos.js` 上传到 GitHub 最外层。刷新网页，照片会排在最前面，标成“我们的照片 1、2、3…”。

脚本会把照片缩到最长边 1600 像素，存成 `.jpg`；同一张照片重复放不会加两次，所以随时可以再放新照片再运行一次。想看每个场地的代号和链接：`python tools/add_photos.py --links`。`photos-to-add` 里的原图不用上传。

**目前没有照片的场地（可以先去下载）：**

| 文件夹代号 | 场地 | 链接 |
|---|---|---|
| `silver_house` | The Silver House Private Villa Janda Baik | https://maps.app.goo.gl/yQv3zAfmxxnBhLmbA?g_st=aw |
| `sunrise_villa` | Sunrise Villa @ Genting Sempah \| Genting HomeStay | https://maps.app.goo.gl/eLmYiCUP4p1mDKoSA?g_st=aw |
| `bird_paradise` | Bird of Paradise Villa at Rainforest Sanctuary | https://maps.app.goo.gl/zDdJfo1xcuzgqCUp7?g_st=aw |
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
- 官方照片下载到本机：`python tools/download_photos.py`。
- 自己的照片：见第 3 节。

## 6. 已确认和还缺什么

**资料比较完整（Airbnb 页面读到的）**：A Genting、B Puchong、C Kajang、Port Dickson（PD4R3BR）、Tanjong Sepat（E & J）、Batu Gajah（Royale Villa）、Bentong（ActB）、Alor Gajah（Memories Homestay 4）、Dusun Bonda。
**只有名字和地址（来自 Google Maps 链接，没有价格、床位、照片）**：Silver House（Janda Baik）、Sunrise Villa 和 Bird of Paradise Villa（Genting Sempah）、H&H Leisure Guest House（马六甲）、GM Pool Villa（波德申，Google 不让我读取分享链接，只拿到名字）。
**还没放进来**：你发的 3 个 Airbnb 搜索页链接，里面的房源编号是 598138597401215012、48247401、727233884641821852，需要房源本身的链接（在 Airbnb App 里打开房源 → 分享 → 复制链接）。
**价格**：只有 A、B、C 和 Dusun Bonda 有价格（你给的）。新增的场地都没有。

**位置与距离**：所有场地的位置只到城镇／区域级（网页上写了“大概位置”）。教会的位置也是 Kuchai Lama 区域级（我没有找到准确地址）。距离是直线距离，**不是车程**，真正车程请点“从教会导航”看 Google Maps。几个在同一地区的场地（例如两个 Genting Sempah 的别墅）的圆点会稍微错开，方便点击。

## 7. 测试情况

在无头 Chromium 里测试（我这边没有外网）：59 项页面测试、28 项登录流程测试通过（多文件版和单文件版各测一遍）；投票脚本 14 项通过。包括：14 个场地的距离和独立算法一致、距离分组、筛选、中英切换、每个场地的详情页、你的 10 张照片能加载、♥／第一选择／提问、对比页每人费用、地图标记和弹出卡片（用模拟地图库）、地图载入失败时的按距离清单，以及**用真正的 Google Apps Script 代码模拟两部手机共用同一张表格**（点赞、第一选择、提问、你在表格里写的回复能显示回来）。

**没有测试到的**：真实的地图底图和 Leaflet 库、Airbnb／官网照片的实际显示、真正部署到你的 Google 账号后的投票和提问（授权步骤我没法代你做）、真机触摸。上传后请用手机点一遍，并让朋友点个赞试试。
