# YEAR-END COUNTDOWN 2026 — 住宿互动地图

网页内容全部是英文（方便投影给大家看）；这份说明用中文写给你自己用。

## 1. 文件结构

```
countdown2026/
├─ index.html            网页入口
├─ styles.css            样式
├─ app.js                程序逻辑
├─ start.bat             Windows 双击启动（本机预览用）
├─ data/properties.js    ★ 所有房源资料、价格、照片清单都在这一个文件
├─ assets/
│  ├─ user-photos/dusun_bonda/   你拍的 10 张 Dusun Bonda 照片（已放进相册，已去掉定位等元数据）
│  └─ images/                    下载脚本会把官方照片存到这里
└─ tools/download_photos.py      一键把官方照片（Airbnb + Dusun Bonda 官网）下载到本机
```

## 2. 上传 Vercel 之前，先在电脑上做这两步（约 2 分钟）

**第 1 步：把官方照片下载进项目。** 我这边没有外网，没办法替你下载。网页里的官方照片现在是“链接”，能显示，但最稳的做法是存成文件，和网页一起上传：

```
cd 你的文件夹路径\countdown2026
python tools/download_photos.py
```

完成后会看到 `Done. saved: xx`。照片存到 `assets/images/`，网页会优先用这些文件，手机打开就不依赖 Airbnb 或官网的服务器。

**第 2 步：上传整个文件夹。** 上传整个 `countdown2026` 文件夹（包括 `assets`、`data`、`tools`），不要只传 index.html。Vercel 不需要任何配置（纯静态网页）：

- 命令行：`npx vercel login`，然后 `npx vercel --prod`，项目目录直接回车。
- 或者把文件夹放到 GitHub，在 vercel.com/new 导入，Framework Preset 选 **Other**，其它留空，点 Deploy。

上传后用手机打开 Vercel 给你的 `https://xxx.vercel.app` 链接即可。

## 3. 价格（已经按你给的填好）

都是 gross（你给的含全部费用的数字），已经显示在地图气泡、卡片、详情页和比较页：

| 地点 | 价格 |
|---|---|
| Airbnb A · Genting | RM2,310 一个晚上 |
| Airbnb B · Puchong | RM1,743 一个晚上 |
| Airbnb C · Kajang | RM1,700 一个晚上 |
| Dusun Bonda | 每人平均约 RM100–120 |

- Dusun Bonda 官网的单位参考价（每单位每晚 RM400–850，含早餐、未含 SST，另加 RM5 可持续费）仍然保留在它的详情页里。
- **每人费用**：在 Compare 页顶部输入参加人数，Airbnb 三个会自动用总价 ÷ 人数算出每人费用，Dusun Bonda 保持你给的 RM100–120。想固定人数，在 `data/properties.js` 最上面的 `meta` 里填 `"participants": 20`。
- 改价格：在 `data/properties.js` 里找到对应地点的 `pricing`，改 `"total"` 的数字就行（Airbnb 三个），或者改 `"perPerson"`（Dusun Bonda）。
- 价格旁边仍然写着“Price and availability for the actual countdown dates must be verified.”，因为空房情况还要确认。
- 你给的 gross 里面包含哪些费用（清洁费、服务费、税）我不知道，页面里也没有写，请你自己确认。

## 4. 地图

- 默认是浅色地图（CARTO Voyager，基于 OpenStreetMap，样子最接近 Google 地图），右上角图层按钮可切换夜间地图和 OpenStreetMap。
- 每个地点是一个带字母的圆点，旁边是价格标签（Airbnb 风格）。标签故意放在圆点的左边或右边，缩小后也不会叠在一起。点击会出现照片、价格、人数、床位和 “View details” 按钮，也有 “Google Maps” 按钮。
- 地图上方有 “Show all 4” 按钮，随时点一下就回到能看到四个地点的视角。
- Google 自己的地图底图需要 Google API Key 并绑定付款方式，所以没有直接使用。如果你有 API Key，告诉我，我可以改成 Google Maps 的底图。
- 所有坐标都是区域级近似位置。Dusun Bonda 的 “Open in Google Maps” 是按名称搜索，能找到准确位置。

## 5. 照片

- Dusun Bonda：你的 10 张照片排在最前面，第一张（泳池和人工瀑布）是封面；后面是官网照片。
- Airbnb A / B / C：来自各自的 Airbnb 页面，没有混用别家的图。
- 想再加照片：放进 `assets/user-photos/<地点id>/`，在 `data/properties.js` 的 `photos` 里加一行：
  ```
  { "src": "assets/user-photos/airbnb_b/living-room.jpg", "caption": "Living room (our own photo)" }
  ```
  地点 id：`airbnb_a`、`airbnb_b`、`airbnb_c`、`dusun_bonda`。

## 6. 仍然缺失

- 三个 Airbnb 在年末日期是否有空房；gross 价格包含哪些费用、押金多少。
- A、C 的真实最大住宿人数；各处的厕所和淋浴数量；A / B / C 的完整设施清单（在 Airbnb 页面点 “Show all amenities”）。
- Dusun Bonda 在 12 月 31 日前后是否有空房，以及是否允许年末倒数聚会（官方规则禁止大声音乐和卡拉 OK，晚上 11 点关门熄灯，只允许清真食物）。
- 你的 10 张照片里，“Covered lounge deck with TV” 那张我不确定是官网上的哪个区域，说明里只写了看得见的内容。

## 7. 测试情况

在无头 Chromium 里测试（我这边没有外网）：94 项页面测试通过，20 项地图代码测试通过（用模拟的地图库）。包括：你的 10 张照片真的能加载、封面和 Glam 4 单位用了你的照片、价格栏和 Google Maps 按钮、价格气泡、输入总价后气泡更新、卡片与地图联动、手机宽度无横向溢出。

**没有测试到：** 真实的浅色地图底图、Airbnb 和官网照片的实际显示、下载脚本的真实下载、真机触摸。请上传后用手机打开，先点一遍确认。
