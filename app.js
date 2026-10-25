/* YEAR-END COUNTDOWN 2026 — places near and far from FGA CYC Kuchai Lama.
   Data: data/properties.js (facts), data/zh.js (Chinese text), data/config.js (shared Google Sheet). */
(function () {
  'use strict';

  var DATA = window.PROPERTIES_DATA;
  if (!DATA || !DATA.properties) {
    document.body.innerHTML = '<p style="padding:2rem;font:16px system-ui">data/properties.js did not load.</p>';
    return;
  }
  /* If some files on the web server are old or missing, say so on the page instead of showing a blank screen. */
  if (!DATA.meta || !DATA.meta.origin) {
    var vv = document.getElementById('view') || document.body;
    vv.innerHTML = '<div style="padding:20px;font:16px/1.5 system-ui;max-width:560px"><h2>Some files are old</h2><p><b>data/properties.js</b> on the website is still the OLD version. Upload the new <b>properties.js</b> into the <b>data</b> folder (not the top level), then refresh twice.</p><p>网站上的 <b>data/properties.js</b> 还是旧版。请把新的 <b>properties.js</b> 上传到 <b>data</b> 文件夹里（不是最外层），然后刷新两次。</p></div>';
    return;
  }
  var ZHD = (window.ZH && window.ZH.places) || {};
  var CFG = window.APP_CONFIG || {};
  var LOGIN = !!(CFG.sheetUrl && CFG.googleClientId);   /* Google sign-in is on only when both are set in config.js */
  var META = DATA.meta, ORIGIN = META.origin, P = DATA.properties, BY = {};

  /* Prices typed into prices.js (top level of the website) replace the prices in the data. */
  var PR = window.PRICES || {};
  P.forEach(function (p) {
    var o = PR[p.id]; if (!o) return;
    p.pricing = p.pricing || {};
    if ('night' in o) { if (Number(o.night) > 0) { p.pricing.total = Number(o.night); p.pricing.totalUnit = 'night'; } else { p.pricing.total = null; } }
    if ('perPerson' in o) { var pp = o.perPerson; p.pricing.perPerson = (pp && pp.length === 2 && Number(pp[0]) > 0) ? { min: Number(pp[0]), max: Number(pp[1]) || Number(pp[0]), note: '(gross)' } : null; }
    if (o.note) p.pricing.note = o.note + (p.pricing.note ? ' ' + p.pricing.note : '');
  });

  /* Photos you drop into assets/user-photos/<place-id>/ are listed in user-photos.js by tools/add_photos.py. They are shown first. */
  var UP = window.USER_PHOTOS || {};
  P.forEach(function (p) {
    var have = {}, add = [];
    p.photos.forEach(function (ph) { if (ph.src) have[ph.src] = 1; });
    (UP[p.id] || []).forEach(function (f) { var src = 'assets/user-photos/' + p.id + '/' + f; if (!have[src]) add.push({ src: src, caption: 'Our photo', own: true }); });
    if (!add.length) return;
    add.forEach(function (ph, i) { ph.n = i + 1; });
    if (CFG.userPhotosFirst === false) { p.photos = p.photos.concat(add); return; }
    (p.bedrooms || []).forEach(function (r) { if (r.photo != null) r.photo += add.length; });
    (p.units || []).forEach(function (u) { if (u.photo != null) u.photo += add.length; });
    p.photos = add.concat(p.photos);
  });
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmtRM = function (n) { return 'RM' + Number(n).toLocaleString('en-MY', { maximumFractionDigits: 2 }); };
  var fmtRM2 = function (n) { return 'RM' + Number(n).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };

  /* ---------- distance from the church ---------- */
  function km(a, b) {
    var R = 6371, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  P.forEach(function (p) { BY[p.id] = p; p.dist = km(ORIGIN, p.location); });
  P.slice().sort(function (a, b) { return a.dist - b.dist; }).forEach(function (p, i) { p.n = i + 1; });
  function band(p) { return p.dist <= META.bands.nearKm ? 'near' : (p.dist <= META.bands.farKm ? 'mid' : 'far'); }
  function distKm(p) { return Math.round(p.dist); }

  /* ---------- saved state ---------- */
  var KEY = 'countdown2026.v2';
  var S = { lang: '', compare: [], voter: '', localLikes: [], localPick: null, localComments: [], band: 'all', sort: 'distance', fac: [], people: '', name: '', auth: { session: '', name: '' } };
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv) Object.keys(sv).forEach(function (k) { S[k] = sv[k]; }); } catch (e) { /* storage unavailable */ }
  if (!S.lang) S.lang = /^zh/i.test(navigator.language || '') ? 'zh' : 'en';
  if (!S.auth || typeof S.auth !== 'object') S.auth = { session: '', name: '' };
  if (!S.voter) S.voter = 'v' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }
  save();

  /* ---------- words ---------- */
  var UI = {
    en: {
      title: 'Year-End Countdown 2026', brand: 'Countdown 2026', pickTitle: 'Where shall we stay?', tagline: '2 days 1 night · from FGA CYC Kuchai Lama',
      tabPlaces: 'Places', tabMap: 'Map', tabCompare: 'Compare', tabTalk: 'Votes & Q&A',
      near: 'Near', mid: 'Medium', far: 'Far', all: 'All', nearR: '≤ {n} km', midR: '{a}–{b} km', farR: '> {n} km',
      sort: 'Sort', sortDistance: 'Nearest first', sortVotes: 'Most liked', sortGuests: 'Most guests', needFac: 'Must have',
      places: 'places', noMatch: 'No places match these filters.', clear: 'Clear filters',
      perNight: '/ night', aboutPP: 'About RM{a}–{b} per person', priceTbc: 'Price to confirm', gross: 'gross',
      guests: 'guests', rooms: 'rooms', beds: 'beds', baths: 'baths', perUnit: 'per unit', units: 'units',
      fromChurch: '≈ {n} km from the church', straight: 'Straight-line distance, not driving time. The pin is at area level.',
      back: 'Back', directions: 'Directions from the church', openMaps: 'Open in Google Maps', mapPin: 'See on map',
      good: 'Good points', watch: 'Watch out', keyFac: 'Key facilities', more: 'More details',
      secBeds: 'Beds & rooms', secBaths: 'Bathrooms', secFac: 'All facilities', secKitchen: 'Kitchen', secPrice: 'Price details', secRules: 'House rules', secTodo: 'Still to confirm', secLinks: 'Original links',
      bedCount: 'Bed count', sleepSpots: 'Sleeping spots (est.)', guestsAllowed: 'Guests allowed (stated)',
      bedCountHint: 'bed frames, without floor mattresses or couches', sleepHint: 'double / queen / king = 2, single = 1, bunk = 2',
      officialLimit: 'Official limit: {a} adults + {c} child under 12', rateRange: '{a} – {b} per unit per night (before SST)',
      ratesTitle: 'Reference rates per unit per night (breakfast included, before SST)', tier1: 'Mon–Thu', tier2: 'Fri, Sun, school holidays', tier3: 'Sat, public holidays and their eve',
      priceDisclaimer: 'Price and availability for the actual countdown dates must be verified.',
      like: 'Like', pick: 'Vote for this place', picked: 'Voted ✓', ask: 'Ask', share: 'Share', shareTitle: 'Share this place', shareHint: 'This is the link to the real place (not this website). Copy it and send it to friends, e.g. on WhatsApp.', copyLink: 'Copy link', copied: 'Link copied', voteWord: 'vote', signinTitle: 'Sign in with Google', signinShort: 'Sign in', signinHint: 'Sign in to like, vote and ask. We only use your name and email, and the organiser can see who voted. Sign in once and your votes stay with you, even on another phone.', signinWait: 'Loading Google sign-in…', signinFail: 'Google sign-in could not load. Check your connection and try again.', signinBad: 'Sign-in did not work. Please try again.', signout: 'Sign out', signoutDone: 'Signed out', signedAs: 'Signed in as', postingAs: 'Posting as', accountTitle: 'Your account', inapp: 'This looks like an in-app browser (Facebook, Instagram, Line, WeChat…). Google blocks sign-in here. Open this page in Chrome or Safari.', whatsapp: 'WhatsApp', openLink: 'Open the place', nameTitle: 'What is your name?', nameHint: 'So the group can see who voted and who asked. It is saved on this phone.', nameSave: 'Save', nameLabel: 'Your name', nameChange: 'Change', cancel: 'Cancel', resTitle: 'Group votes', resNone: 'No votes yet. Open a place and tap “Vote for this place”.', resAll: 'See all', votesWord: 'votes',
      askTitle: 'Ask a question or leave a comment', yourName: 'Your name (optional)', yourQ: 'Your question or comment', send: 'Send', sent: 'Sent. Thank you!', sendFail: 'Could not send. Try again.',
      noQ: 'No questions yet. Be the first.', reply: 'Reply', anon: 'Anonymous', general: 'General',
      localNote: 'Votes and questions are saved on this phone only. Everyone will see them once the Google Sheet is connected.',
      sharedNote: 'Shared: everyone sees the same votes and questions.', offlineNote: 'Could not reach the shared sheet. Showing what this phone knows.',
      compareTitle: 'Compare', compareHint: 'Tap the scale icon on up to 3 places, then compare them here.', compareEmpty: 'No places selected yet.', compareAdd: 'Add to compare', compareRemove: 'Remove from compare', compareMax: 'You can compare up to 3 places. The oldest one was replaced.',
      people: 'Number of people', perPerson: 'Per person', perPersonHint: 'Enter the number of people to see the cost per person.',
      rowDistance: 'From the church', rowPrice: 'Price', rowGuests: 'Guests', rowRooms: 'Rooms and beds', rowBaths: 'Bathrooms', rowPool: 'Pool', rowBbq: 'BBQ', rowKaraoke: 'Karaoke', rowVotes: 'Likes',
      talkTitle: 'Votes & Q&A', ranking: 'Ranking', rankHint: 'One vote per person (you can change it). Likes are extra.', picksLabel: 'votes',
      questions: 'Questions and comments', askGeneral: 'Ask something general',
      mapNear: 'Near view', mapAll: 'All places', church: 'FGA CYC Kuchai Lama', legendChurch: 'Church (start)',
      mapFail: 'The map could not load (offline?). Here are the places by distance instead.', loadingMap: 'Loading map…', details: 'Details',
      noPhoto: 'No photo yet', photoOff: 'Photo unavailable', photosOf: 'Photo {i} of {n}',
      status_confirmed: 'Confirmed', status_not_provided: 'Not provided', status_not_disclosed: 'Not disclosed', status_additional_charge: 'Extra charge', status_need_confirmation: 'To confirm',
      english: 'Details below are in English.', reviews: 'reviews', close: 'Close',
      facPool: 'Pool', facBbq: 'BBQ', facKaraoke: 'Karaoke', photoCount: 'photos, tap to enlarge', ourPhoto: 'Our photo'
    },
    zh: {
      title: '年终倒数 2026', brand: '年终倒数 2026', pickTitle: '我们住哪里？', tagline: '两天一夜 · 从 FGA CYC Kuchai Lama 出发',
      tabPlaces: '场地', tabMap: '地图', tabCompare: '对比', tabTalk: '投票·提问',
      near: '近', mid: '中等', far: '远', all: '全部', nearR: '≤ {n} 公里', midR: '{a}–{b} 公里', farR: '> {n} 公里',
      sort: '排序', sortDistance: '最近优先', sortVotes: '最多赞', sortGuests: '人数最多', needFac: '必须有',
      places: '个场地', noMatch: '没有符合条件的场地。', clear: '清除筛选',
      perNight: '/ 晚', aboutPP: '约 RM{a}–{b} / 人', priceTbc: '价格待确认', gross: 'gross',
      guests: '人', rooms: '房', beds: '床', baths: '浴室', perUnit: '每单位', units: '个单位',
      fromChurch: '离教会约 {n} 公里', straight: '直线距离，不是车程。地图上的位置只到区域级。',
      back: '返回', directions: '从教会导航', openMaps: '在 Google Maps 打开', mapPin: '在地图上看',
      good: '优点', watch: '注意', keyFac: '重点设施', more: '更多资料',
      secBeds: '床位和房间', secBaths: '浴室', secFac: '全部设施', secKitchen: '厨房', secPrice: '价格详情', secRules: '住宿规则', secTodo: '待确认', secLinks: '原始链接',
      bedCount: '床数', sleepSpots: '可睡人数（估算）', guestsAllowed: '可入住人数（房东说明）',
      bedCountHint: '不含地垫和沙发', sleepHint: '双人/皇后/国王床=2，单人床=1，双层床=2',
      officialLimit: '官方上限：{a} 位成人 + {c} 名 12 岁以下儿童', rateRange: '每单位每晚 {a} – {b}（未含 SST）',
      ratesTitle: '每单位每晚参考价（含早餐，未含 SST）', tier1: '周一至周四', tier2: '周五、周日、学校假期', tier3: '周六、公共假期及其前夕',
      priceDisclaimer: '倒数日期的价格和空房必须再确认。',
      like: '赞', pick: '投一票给这里', picked: '已投票 ✓', ask: '提问', share: '分享', shareTitle: '分享这个场地', shareHint: '这是真正的地点链接（不是本网站）。复制后可以发给朋友，例如发到 WhatsApp。', copyLink: '复制链接', copied: '链接已复制', voteWord: '票', signinTitle: '用 Google 登录', signinShort: '登录', signinHint: '登录后才能点赞、投票和提问。我们只用你的名字和邮箱，主办人能看到谁投了票。登录一次，你的票会一直跟着你，换手机也在。', signinWait: '正在载入 Google 登录…', signinFail: '无法载入 Google 登录，请检查网络后再试。', signinBad: '登录没有成功，请再试一次。', signout: '退出登录', signoutDone: '已退出登录', signedAs: '已登录：', postingAs: '以这个身份发言：', accountTitle: '你的账号', inapp: '这好像是应用内置浏览器（Facebook、Instagram、Line、微信…），Google 会拦截登录。请用 Chrome 或 Safari 打开这个网页。', whatsapp: 'WhatsApp', openLink: '打开这个地点', nameTitle: '你的名字是？', nameHint: '让大家知道谁投了票、谁提了问。名字只保存在这部手机上。', nameSave: '保存', nameLabel: '你的名字', nameChange: '修改', cancel: '取消', resTitle: '大家的投票', resNone: '还没有人投票。打开一个场地，点“投一票给这里”。', resAll: '查看全部', votesWord: '票',
      askTitle: '提问或留言', yourName: '你的名字（可不填）', yourQ: '你的问题或留言', send: '发送', sent: '已发送，谢谢！', sendFail: '发送失败，请再试一次。',
      noQ: '还没有人提问，你来第一个。', reply: '回复', anon: '匿名', general: '综合',
      localNote: '投票和提问目前只保存在这部手机上。连接 Google Sheet 后，所有人才会看到。',
      sharedNote: '已共享：所有人看到的票数和问题都一样。', offlineNote: '连不上共享表格，先显示这部手机上的内容。',
      compareTitle: '对比', compareHint: '在最多 3 个场地上点天平图标，然后在这里对比。', compareEmpty: '还没有选择场地。', compareAdd: '加入对比', compareRemove: '移出对比', compareMax: '最多对比 3 个场地，已替换最早的一个。',
      people: '人数', perPerson: '每人', perPersonHint: '输入人数，就能看到每人费用。',
      rowDistance: '离教会', rowPrice: '价格', rowGuests: '可住人数', rowRooms: '房间和床', rowBaths: '浴室', rowPool: '泳池', rowBbq: 'BBQ', rowKaraoke: '卡拉 OK', rowVotes: '赞',
      talkTitle: '投票·提问', ranking: '排行', rankHint: '每人一票（可以改票），♥ 另算。', picksLabel: '票',
      questions: '问题和留言', askGeneral: '问一个综合问题',
      mapNear: '近处视图', mapAll: '全部场地', church: 'FGA CYC Kuchai Lama', legendChurch: '教会（出发点）',
      mapFail: '地图载入失败（可能没有网络）。改用按距离排列的清单。', loadingMap: '正在载入地图…', details: '详情',
      noPhoto: '还没有照片', photoOff: '照片无法显示', photosOf: '第 {i} 张，共 {n} 张',
      status_confirmed: '已确认', status_not_provided: '不提供', status_not_disclosed: '未说明', status_additional_charge: '另收费', status_need_confirmation: '待确认',
      english: '以下详细资料为英文。', reviews: '条评价', close: '关闭',
      facPool: '泳池', facBbq: 'BBQ', facKaraoke: '卡拉 OK', photoCount: '张照片，点开放大', ourPhoto: '我们的照片'
    }
  };
  function t(key, v) {
    var s = (UI[S.lang] && UI[S.lang][key]) || UI.en[key] || key;
    if (v) Object.keys(v).forEach(function (k) { s = s.split('{' + k + '}').join(v[k]); });
    return s;
  }
  var AM = [
    ['pool', 'Swimming pool', '游泳池', 'pool', 'fun'], ['bbq', 'BBQ facilities', 'BBQ 设施', 'bbq', 'fun'], ['karaoke', 'Karaoke', '卡拉 OK', 'mic', 'fun'],
    ['mahjong', 'Mahjong', '麻将', 'dice', 'fun'], ['boardgames', 'Board games', '桌游', 'dice', 'fun'], ['gaming', 'Gaming facilities', '游戏设备', 'gamepad', 'fun'],
    ['projector', 'Projector / meeting space', '投影／会议空间', 'screen', 'fun'], ['other', 'Other entertainment', '其他娱乐', 'spark', 'fun'],
    ['living', 'Living hall', '客厅', 'sofa', 'space'], ['dining', 'Dining area', '餐区', 'utensils', 'space'],
    ['garden', 'Garden', '花园', 'tree', 'nature'], ['river', 'River', '河', 'water', 'nature'], ['waterfall', 'Waterfall', '瀑布', 'water', 'nature'],
    ['playground', 'Playground', '游乐场', 'slide', 'nature'], ['outdoor', 'Outdoor activities', '户外活动', 'mountain', 'nature'],
    ['kitchen', 'Kitchen', '厨房', 'pot', 'kitchen'], ['fridge', 'Refrigerator', '冰箱', 'fridge', 'kitchen'], ['microwave', 'Microwave', '微波炉', 'microwave', 'kitchen'],
    ['ricecooker', 'Rice cooker', '电饭锅', 'rice', 'kitchen'], ['stove', 'Stove', '炉具', 'stove', 'kitchen'], ['utensils', 'Cooking utensils', '煮食用具', 'pot', 'kitchen'],
    ['plates', 'Plates & cutlery', '碗碟餐具', 'plate', 'kitchen'], ['waterdisp', 'Water dispenser', '饮水机', 'dispenser', 'kitchen'],
    ['wifi', 'Wi-Fi', 'Wi-Fi', 'wifi', 'comfort'], ['aircon', 'Air conditioning', '冷气', 'snow', 'comfort'], ['fans', 'Fans', '风扇', 'fan', 'comfort'], ['parking', 'Parking', '停车', 'car', 'comfort']
  ];
  var AM_GROUPS = [['fun', 'Fun & entertainment', '娱乐'], ['space', 'Indoor spaces', '室内空间'], ['nature', 'Garden & nature', '花园和大自然'], ['kitchen', 'Kitchen & dining supplies', '厨房和餐具'], ['comfort', 'Comfort & access', '舒适和交通']];
  var AMX = {}; AM.forEach(function (a) { AMX[a[0]] = a; });
  var KITCHEN_ROWS = [['selfCooking', 'Self-cooking allowed', '可以自己煮'], ['fridge', 'Refrigerator', '冰箱'], ['stove', 'Stove / cooktop', '炉具'], ['potsPans', 'Pots, pans & woks', '锅具'], ['knivesBoard', 'Knives & chopping board', '刀和砧板'], ['tableware', 'Plates, cups & cutlery', '碗碟杯和餐具'], ['kettle', 'Kettle', '烧水壶'], ['water', 'Drinking water / dispenser', '饮用水／饮水机'], ['dishSoap', 'Dish-washing liquid', '洗碗液'], ['bbqAllowed', 'BBQ allowed', '可以 BBQ'], ['ownSupplies', 'Charcoal, food & seasoning', '炭、食材和调味料'], ['limits', 'Usage limits & rules', '使用限制']];
  var BATH_ROWS = [['total', 'Bathrooms', '浴室数量'], ['toilets', 'Toilets', '厕所'], ['showers', 'Showers', '淋浴'], ['privacy', 'Private or shared', '独立或共用'], ['hotWater', 'Hot water', '热水'], ['toiletries', 'Shampoo & body wash', '洗发水和沐浴露'], ['towels', 'Towels', '毛巾'], ['extraToilets', 'Extra common toilets', '额外公共厕所'], ['location', 'Indoor / outdoor', '室内／室外']];
  var PRICE_ROWS = [['nightly', 'Nightly price', '每晚价格'], ['cleaning', 'Cleaning fee', '清洁费'], ['service', 'Service fee', '服务费'], ['taxes', 'Taxes & local fees', '税和地方费用'], ['deposit', 'Deposit', '押金'], ['extraGuests', 'Extra-guest charge', '额外人数收费'], ['extraMattress', 'Extra mattress', '加床垫'], ['activities', 'BBQ & other charges', 'BBQ 和其他收费'], ['meals', 'Meals included', '含餐'], ['multiUnit', 'Several units needed?', '需要订多个单位吗'], ['minStay', 'Minimum stay', '最少入住']];
  var BED = { king: ['King bed', '国王床'], queen: ['Queen bed', '皇后床'], double: ['Double bed', '双人床'], single: ['Single bed', '单人床'], bunk: ['Bunk bed', '双层床'], sofa_bed: ['Sofa bed', '沙发床'], floor_mattress: ['Floor mattress', '地垫'], couch: ['Couch (not a bed)', '沙发（不算床）'] };
  var UNIT_ZH = { studio: 'Studio 别墅', glam5: 'Glam 5 高级钟形帐篷', glam4: 'Glam 4 钟形帐篷' };
  var STATUS = { confirmed: { cls: 'ok', g: '✓' }, not_provided: { cls: 'no', g: '✕' }, not_disclosed: { cls: 'nd', g: '–' }, additional_charge: { cls: 'fee', g: '$' }, need_confirmation: { cls: 'nc', g: '?' } };
  function lab(arr) { return S.lang === 'zh' ? arr[2] : arr[1]; }
  function amLabel(k) { var a = AMX[k]; return S.lang === 'zh' ? a[2] : a[1]; }
  function bedLabel(k) { return BED[k][S.lang === 'zh' ? 1 : 0]; }
  function pill(status, qual) {
    var st = STATUS[status] ? status : 'not_disclosed', s = STATUS[st];
    return '<span class="pill ' + s.cls + '"><i aria-hidden="true">' + s.g + '</i>' + esc(t('status_' + st)) + (qual ? ' · ' + esc(qual) : '') + '</span>';
  }
  function rec(o, k) { return (o && o[k]) || { status: 'not_disclosed' }; }
  function amStatus(p, k) { return rec(p.amenities, k).status; }

  /* ---------- Chinese text helpers ---------- */
  function Z(p, key) { var z = ZHD[p.id]; return (S.lang === 'zh' && z && z[key] != null) ? z[key] : null; }
  function regionOf(p) { return Z(p, 'region') || p.region; }
  function typeOf(p) { return Z(p, 'type') || p.type; }
  function summaryOf(p) { return Z(p, 'summary') || p.summary || ''; }
  function listOf(p, key) { var zl = Z(p, key), en = p[key] || []; return (zl && zl.length === en.length) ? zl : en; }
  function rulesOf(p) {
    var zl = Z(p, 'rules'); if (!p.rules) return [];
    return p.rules.map(function (r, i) { var z = zl && zl[i]; return { tone: r.tone, title: (z && z.title) || r.title, body: (z && z.body) || r.body }; });
  }

  /* ---------- icons ---------- */
  var IC = {
    bed: '<path d="M3 19V6"/><path d="M3 14h18v5"/><path d="M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/>',
    bath: '<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M7 19l-1 2M17 19l1 2"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M17 14c2.5 0 4 2 4 4.5"/>',
    pool: '<path d="M8 14V5a2 2 0 0 1 4 0"/><path d="M14 14V5a2 2 0 0 1 4 0"/><path d="M8 9h6"/><path d="M3 17c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0"/><path d="M3 21c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0"/>',
    bbq: '<path d="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.7.8-2.8 1.8-3.8.2 1 .7 1.6 1.4 1.8C11.4 7.5 11.2 5.2 12 3z"/>',
    pot: '<path d="M4 11h16v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/><path d="M2 11h20"/><path d="M8 7c0-1.5 1-1.5 1-3M12 7c0-1.5 1-1.5 1-3M16 7c0-1.5 1-1.5 1-3"/>',
    car: '<path d="M4 16v-4l2-5h12l2 5v4"/><path d="M3 16h18v2H3z"/><circle cx="7.5" cy="18.5" r="1.2"/><circle cx="16.5" cy="18.5" r="1.2"/>',
    wifi: '<path d="M2 9a15 15 0 0 1 20 0"/><path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    tree: '<path d="M12 21v-6"/><path d="M12 15c-4 0-6-2.5-6-5.5C6 6.5 8.5 4 12 3c3.5 1 6 3.5 6 6.5 0 3-2 5.5-6 5.5z"/>',
    water: '<path d="M12 3s6 6 6 10.5A6 6 0 0 1 6 13.5C6 9 12 3 12 3z"/>',
    slide: '<path d="M5 4v16"/><path d="M5 6c8 0 12 4 14 14"/><path d="M3 20h18"/>',
    screen: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
    snow: '<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"/>',
    fan: '<circle cx="12" cy="12" r="2"/><path d="M12 10C12 5 9 3.5 8 5s.5 4 4 5zM14 12c5 0 6.5-3 5-4s-4 .5-5 4zM12 14c0 5 3 6.5 4 5s-.5-4-4-5zM10 12c-5 0-6.5 3-5 4s4-.5 5-4z"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/>',
    gamepad: '<rect x="3" y="8" width="18" height="9" rx="4"/><path d="M8 11v3M6.5 12.5h3"/><circle cx="15.5" cy="12" r=".8"/><circle cx="17.5" cy="13.5" r=".8"/>',
    sofa: '<path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M3 12a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v5H3z"/>',
    utensils: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 3c-2 2-2.5 5-2.5 8H17v10"/>',
    fridge: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 10h12M9 6v2M9 13v3"/>',
    microwave: '<rect x="3" y="6" width="18" height="12" rx="2"/><rect x="6" y="9" width="8" height="6" rx="1"/><path d="M17 9v.01M17 12v.01M17 15v.01"/>',
    rice: '<path d="M5 12a7 7 0 0 1 14 0v7H5z"/><path d="M12 5V3M5 15h14"/>',
    stove: '<rect x="3" y="9" width="18" height="10" rx="2"/><circle cx="8" cy="14" r="2"/><circle cx="16" cy="14" r="2"/><path d="M8 6c0-1 1-1 1-3M13 6c0-1 1-1 1-3"/>',
    plate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>',
    dispenser: '<rect x="7" y="3" width="10" height="7" rx="2"/><path d="M8 10v9a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-9"/><path d="M12 13v2"/>',
    mountain: '<path d="M3 19l6-11 4 7 3-4 5 8z"/>',
    spark: '<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    scale: '<path d="M12 4v16M7 20h10M5 8h14"/><path d="M5 8l-3 7a3 3 0 0 0 6 0zM19 8l-3 7a3 3 0 0 0 6 0z"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6"/>',
    church: '<path d="M12 2v6M9 5h6M5 22V13l7-5 7 5v9zM10 22v-5h4v5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    back: '<path d="M15 5l-7 7 7 7"/>'
  };
  function icon(n, s) { s = s || 20; return '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || IC.spark) + '</svg>'; }

  /* ---------- numbers shown to people ---------- */
  function bedStats(p) {
    var tt = {}; (p.bedrooms || []).forEach(function (r) { r.beds.forEach(function (b) { tt[b.type] = (tt[b.type] || 0) + b.qty; }); });
    var n = function (k) { return tt[k] || 0; };
    var units = n('king') + n('queen') + n('double') + n('single') + n('bunk') + n('sofa_bed');
    return { t: tt, units: units, spots: 2 * (n('king') + n('queen') + n('double')) + n('single') + 2 * n('bunk') + n('sofa_bed'), floor: n('floor_mattress') };
  }
  function guestsText(p) {
    if (!p.guests) return '?';
    if (p.guests.perUnit) return '4–6 / ' + t('perUnit');
    return p.guests.n + (p.guests.plus ? '+' : '');
  }
  function bedsText(p) { return (p.headline && p.headline.beds != null) ? String(p.headline.beds) : '?'; }
  function price(p) {
    var pr = p.pricing || {};
    if (pr.total > 0) return { text: fmtRM(pr.total) + ' ' + t('perNight'), known: true };
    if (pr.perPerson) return { text: t('aboutPP', { a: pr.perPerson.min, b: pr.perPerson.max }), known: true };
    return { text: t('priceTbc'), known: false };
  }
  function distBadge(p) { return '<span class="dist band-' + band(p) + '">≈ ' + distKm(p) + ' km · ' + esc(t(band(p))) + '</span>'; }
  /* the real place's own link (Airbnb room, official site or Google Maps link), never this website */
  function realUrl(p) {
    var u = (p.links && p.links[0] && p.links[0].url) || p.location.gmaps, m = /airbnb\.[a-z.]+\/rooms\/(\d+)/.exec(u);
    return m ? 'https://www.airbnb.com/rooms/' + m[1] : u;
  }
  function dirUrl(p) {
    return 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(ORIGIN.dirQuery) + '&destination=' + encodeURIComponent(p.location.dirQuery || (p.location.lat + ',' + p.location.lng));
  }

  function capText(ph) { return ph.own ? t('ourPhoto') + ' ' + ph.n : ph.caption; }
  /* ---------- photos (local folder first, then the original link, then a placeholder) ---------- */
  function baseName(u) { var s = String(u).split('?')[0].split('/').pop(); try { s = decodeURIComponent(s); } catch (e) { /* raw */ } return s.replace(/[^A-Za-z0-9._-]/g, '_'); }
  function photoSrcs(p, i, size) {
    var ph = p.photos[i]; if (!ph) return [];
    if (ph.src) return [ph.src];
    var out = ['assets/images/' + p.id + '/' + baseName(ph.remote)];
    if (/muscache\.com/.test(ph.remote)) { var big = ph.remote + '?im_w=1200', small = ph.remote + '?im_w=720'; out = out.concat(size === 'large' ? [big, small] : [small, big]); } else out.push(ph.remote);
    return out;
  }
  function img(p, i, size, cls) {
    var s = photoSrcs(p, i, size), ph = p.photos[i];
    if (!s.length) return '<div class="noph"><span>' + esc(t('noPhoto')) + '</span></div>';
    return '<img class="' + (cls || '') + '" src="' + esc(s[0]) + '" data-fb="' + esc(s.slice(1).join('|')) + '" alt="' + esc(p.name + ' — ' + capText(ph)) + '" loading="' + (size === 'large' ? 'eager' : 'lazy') + '" decoding="async">';
  }
  document.addEventListener('error', function (e) {
    var el = e.target; if (!el || el.tagName !== 'IMG') return;
    var fb = (el.getAttribute('data-fb') || '').split('|').filter(Boolean);
    if (fb.length) { el.setAttribute('data-fb', fb.slice(1).join('|')); el.src = fb[0]; return; }
    var d = document.createElement('div'); d.className = 'noph ' + (el.className || ''); d.setAttribute('role', 'img'); d.setAttribute('aria-label', el.alt || t('photoOff'));
    d.innerHTML = '<span>' + esc(t('photoOff')) + '</span>'; el.replaceWith(d);
  }, true);

  /* ---------- votes and questions (Google Sheet, or this phone only) ---------- */
  var Soc = { shared: !!CFG.sheetUrl, likes: {}, picks: {}, mine: { likes: [], pick: null }, comments: [], offline: false };
  function localSummary() {
    Soc.likes = {}; Soc.picks = {};
    S.localLikes.forEach(function (id) { Soc.likes[id] = 1; });
    if (S.localPick) Soc.picks[S.localPick] = 1;
    Soc.mine = { likes: S.localLikes.slice(), pick: S.localPick };
    Soc.comments = S.localComments.slice();
  }
  function applySummary(j) {
    if (!(j && j.ok)) return;
    Soc.likes = j.likes || {}; Soc.picks = j.picks || {}; Soc.mine = j.mine || { likes: [], pick: null }; Soc.comments = j.comments || []; Soc.offline = false;
    if (LOGIN) {
      if (j.me && j.me.name) { if (S.auth.name !== j.me.name) { S.auth.name = j.me.name; save(); refreshAuthUI(); } }
      else if (S.auth.session) { S.auth = { session: '', name: '' }; save(); refreshAuthUI(); }   /* session ran out: show signed out */
    }
  }
  function socLoad() {
    if (!Soc.shared) { localSummary(); return Promise.resolve(); }
    return fetch(CFG.sheetUrl + (CFG.sheetUrl.indexOf('?') > -1 ? '&' : '?') + 'voter=' + encodeURIComponent(S.voter) + '&name=' + encodeURIComponent(S.name || '') + '&session=' + encodeURIComponent(S.auth.session || ''))
      .then(function (r) { return r.json(); }).then(applySummary)
      .catch(function () { Soc.offline = true; }).then(function () { refreshSocial(); });
  }
  function socPost(payload) {
    return fetch(CFG.sheetUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ voter: S.voter, name: S.name || '', session: S.auth.session || '' }, payload)) })
      .then(function (r) { return r.json(); }).then(function (j) {
        if (!j.ok) { if (LOGIN && j.error === 'login required') handleLoginRequired(); throw new Error(j.error || 'failed'); }
        applySummary(j); Soc.offline = false; return j;
      });
  }
  function postFailed(e) { if (!/login required/.test(String(e && e.message))) Soc.offline = true; }
  function isLiked(id) { return Soc.mine.likes.indexOf(id) > -1; }
  function likeCount(id) { return Soc.likes[id] || 0; }
  function hasIdentity() { return LOGIN ? !!S.auth.session : !!S.name; }
  function requireIdentity(cb) { if (LOGIN) openSignIn(cb); else askName(cb); }
  function toggleLike(id) {
    var on = !isLiked(id);
    if ((on || LOGIN) && !hasIdentity()) { requireIdentity(function () { if (isLiked(id) !== on) toggleLike(id); }); return; }
    if (on) { Soc.mine.likes.push(id); Soc.likes[id] = likeCount(id) + 1; } else { Soc.mine.likes = Soc.mine.likes.filter(function (x) { return x !== id; }); Soc.likes[id] = Math.max(0, likeCount(id) - 1); }
    if (!Soc.shared) { S.localLikes = Soc.mine.likes.slice(); save(); } else socPost({ action: 'like', id: id, venue: BY[id].name, on: on }).catch(postFailed).then(refreshSocial);
    refreshSocial();
  }
  function setPick(id) {
    var prev = Soc.mine.pick, on = prev !== id;
    if ((on || LOGIN) && !hasIdentity()) { requireIdentity(function () { if ((Soc.mine.pick === id) !== on) setPick(id); }); return; }
    if (prev) Soc.picks[prev] = Math.max(0, (Soc.picks[prev] || 0) - 1);
    Soc.mine.pick = on ? id : null; if (on) Soc.picks[id] = (Soc.picks[id] || 0) + 1;
    if (!Soc.shared) { S.localPick = Soc.mine.pick; save(); } else socPost({ action: 'pick', id: id, venue: BY[id].name, on: on }).catch(postFailed).then(refreshSocial);
    refreshSocial();
  }
  function addComment(id, name, text) {
    var venue = id === 'general' ? t('general') : BY[id].name;
    if (!Soc.shared) {
      S.localComments.push({ id: id, venue: venue, name: name || S.name || '', text: text, time: new Date().toISOString(), reply: '' }); save(); localSummary(); refreshSocial(); return Promise.resolve();
    }
    return socPost({ action: 'comment', id: id, venue: venue, name: name || S.name || '', text: text, lang: S.lang }).then(refreshSocial);
  }

  /* ---------- small helpers for views ---------- */
  var view = $('#view'), mapView = $('#mapView'), current = { v: 'places' };
  function toast(msg) {
    var el = $('#toast'); el.textContent = msg; el.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function () { el.hidden = true; }, 2600);
  }
  var modal = $('#modal'), afterName = null;
  function openModal(html) { $('#modalIn').innerHTML = html; modal.hidden = false; document.body.classList.add('noscroll'); var f = $('#modalIn input'); if (f) setTimeout(function () { f.focus(); }, 80); }
  function closeModal() { modal.hidden = true; document.body.classList.remove('noscroll'); afterName = null; }
  function askName(cb) {
    afterName = cb;
    openModal('<h3>' + esc(t('nameTitle')) + '</h3><p class="muted small">' + esc(t('nameHint')) + '</p><input type="text" id="nameInput" maxlength="40" value="' + esc(S.name) + '" autocomplete="name"><div class="mbtns"><button type="button" class="btn" data-modalclose>' + esc(t('cancel')) + '</button><button type="button" class="btn primary" data-namesave>' + esc(t('nameSave')) + '</button></div>');
  }
  function saveName() {
    var v = ($('#nameInput') || {}).value; v = (v || '').trim(); if (!v) { var i = $('#nameInput'); if (i) i.focus(); return; }
    S.name = v; save(); var cb = afterName; closeModal(); renderNameBoxes(); if (cb) cb();
  }
  function renderNameBoxes() { $$('[data-namebox]').forEach(function (el) { el.innerHTML = nameBoxHtml(); }); }
  function nameBoxHtml() {
    if (LOGIN) return S.auth.session ? '<span class="muted small">' + esc(t('signedAs')) + '</span> <b>' + esc(S.auth.name) + '</b> <button type="button" class="linkbtn" data-signout>' + esc(t('signout')) + '</button>' : '<button type="button" class="btn primary" data-signin>' + esc(t('signinTitle')) + '</button>';
    return '<span class="muted small">' + esc(t('nameLabel')) + ':</span> <b>' + esc(S.name || '—') + '</b> <button type="button" class="linkbtn" data-namechange>' + esc(t('nameChange')) + '</button>'; }
  /* ---------- Google sign-in ---------- */
  var gisInit = false, afterLogin = null;
  function loadGIS() {
    if (!LOGIN || document.getElementById('gis-js')) return;
    var s = document.createElement('script'); s.id = 'gis-js'; s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.defer = true; document.head.appendChild(s);
  }
  function whenGIS(cb, tries) {
    tries = tries || 0;
    if (window.google && window.google.accounts && window.google.accounts.id) { cb(true); return; }
    if (tries > 80) { cb(false); return; }
    setTimeout(function () { whenGIS(cb, tries + 1); }, 100);
  }
  function inAppBrowser() { return /FBAN|FBAV|Instagram|Line\/|MicroMessenger|Messenger|Snapchat|TikTok/i.test(navigator.userAgent || ''); }
  function openSignIn(cb) {
    afterLogin = cb || null;
    openModal('<h3>' + esc(t('signinTitle')) + '</h3><p class="muted small">' + esc(t('signinHint')) + '</p>' +
      (inAppBrowser() ? '<p class="snote warn">' + esc(t('inapp')) + '</p>' : '') +
      '<div id="gbtn" class="gbtn"><span class="muted small">' + esc(t('signinWait')) + '</span></div><div class="mbtns"><button type="button" class="btn" data-modalclose>' + esc(t('cancel')) + '</button></div>');
    loadGIS();
    whenGIS(function (ok) {
      var box = $('#gbtn'); if (!box) return;
      if (!ok) { box.innerHTML = '<span class="snote warn">' + esc(t('signinFail')) + '</span>'; return; }
      if (!gisInit) { google.accounts.id.initialize({ client_id: CFG.googleClientId, callback: onCredential, auto_select: false }); gisInit = true; }
      box.innerHTML = '';
      google.accounts.id.renderButton(box, { type: 'standard', theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', width: 260, locale: S.lang === 'zh' ? 'zh_CN' : 'en' });
    });
  }
  function onCredential(resp) {
    socPost({ action: 'login', credential: resp && resp.credential }).then(function (j) {
      S.auth = { session: j.session, name: (j.me && j.me.name) || '' }; save();
      var cb = afterLogin; afterLogin = null; closeModal(); refreshAuthUI(); refreshSocial();
      if (cb) cb();
    }).catch(function () { toast(t('signinBad')); });
  }
  function handleLoginRequired() {
    S.auth = { session: '', name: '' }; save(); Soc.mine = { likes: [], pick: null }; refreshAuthUI(); refreshSocial(); openSignIn(null); socLoad();
  }
  function signOut() {
    S.auth = { session: '', name: '' }; save(); Soc.mine = { likes: [], pick: null };
    try { if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect(); } catch (e) { /* ignore */ }
    closeModal(); refreshAuthUI(); refreshSocial(); toast(t('signoutDone'));
  }
  function openAccount() {
    openModal('<h3>' + esc(t('accountTitle')) + '</h3><p>' + esc(t('signedAs')) + ' <b>' + esc(S.auth.name) + '</b></p><div class="mbtns"><button type="button" class="btn" data-modalclose>' + esc(t('close')) + '</button><button type="button" class="btn primary" data-signout>' + esc(t('signout')) + '</button></div>');
  }
  function renderAccount() {
    var el = $('#acct'); if (!el) return;
    if (!LOGIN) { el.innerHTML = ''; return; }
    if (!S.auth.session) { el.innerHTML = '<button type="button" class="signin-sm" data-signin>' + esc(t('signinShort')) + '</button>'; return; }
    el.innerHTML = '<button type="button" class="avatar" data-account aria-label="' + esc(t('accountTitle') + ': ' + S.auth.name) + '">' + esc((S.auth.name || '?').trim().charAt(0).toUpperCase()) + '</button>';
  }
  function postAsHtml() {
    return S.auth.session ? '<span class="muted small">' + esc(t('postingAs')) + '</span> <b>' + esc(S.auth.name) + '</b>' : '<button type="button" class="btn" data-signin>' + esc(t('signinTitle')) + '</button>';
  }
  function refreshAuthUI() { renderAccount(); renderNameBoxes(); $$('[data-postas]').forEach(function (el) { el.innerHTML = postAsHtml(); }); }
  function openShare(id) {
    var p = BY[id], url = realUrl(p), msg = p.name + '\n' + url;
    openModal('<h3>' + esc(t('shareTitle')) + '</h3><p><b>' + esc(p.name) + '</b></p><p class="muted small">' + esc(t('shareHint')) + '</p><input type="text" id="shareUrl" readonly value="' + esc(url) + '" aria-label="link">' +
      '<div class="mbtns"><button type="button" class="btn primary" data-copy>' + icon('copy', 16) + esc(t('copyLink')) + '</button><a class="btn" id="waLink" href="https://wa.me/?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener noreferrer">' + icon('chat', 16) + esc(t('whatsapp')) + '</a></div>' +
      '<div class="mbtns"><a class="btn ghost" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + icon('link', 16) + esc(t('openLink')) + '</a><button type="button" class="btn ghost" data-modalclose>' + esc(t('close')) + '</button></div>');
  }
  function copyShare() {
    var inp = $('#shareUrl'); if (!inp) return; var done = function () { toast(t('copied')); };
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(inp.value).then(done, function () { inp.select(); document.execCommand('copy'); done(); }); }
    else { inp.select(); inp.setSelectionRange(0, 999); try { document.execCommand('copy'); } catch (e) { /* user can copy by hand */ } done(); }
  }
  function shareBtn(id) { return '<button type="button" class="shr" data-share="' + id + '" aria-label="' + esc(t('share')) + '">' + icon('share', 18) + '</button>'; }
  function likeBtn(id, cls) {
    return '<button type="button" class="like ' + (cls || '') + (isLiked(id) ? ' on' : '') + '" data-like="' + id + '" aria-pressed="' + isLiked(id) + '" aria-label="' + esc(t('like')) + '">' + icon('heart', 18) + '<b data-likecount="' + id + '">' + likeCount(id) + '</b></button>';
  }
  function cmpBtn(id, label) {
    var on = S.compare.indexOf(id) > -1;
    return '<button type="button" class="cmp' + (on ? ' on' : '') + '" data-cmp="' + id + '" aria-pressed="' + on + '" aria-label="' + esc(t(on ? 'compareRemove' : 'compareAdd')) + '">' + icon('scale', 18) + (label ? '<span>' + esc(t('tabCompare')) + '</span>' : '') + '</button>';
  }

  /* ---------- PLACES ---------- */
  function matchesFac(p) { return S.fac.every(function (k) { var s = amStatus(p, k); return s === 'confirmed' || s === 'additional_charge'; }); }
  function visiblePlaces() {
    var list = P.filter(function (p) { return (S.band === 'all' || band(p) === S.band) && matchesFac(p); });
    list.sort(function (a, b) {
      if (S.sort === 'votes') return ((Soc.picks[b.id] || 0) * 1000 + likeCount(b.id)) - ((Soc.picks[a.id] || 0) * 1000 + likeCount(a.id)) || a.dist - b.dist;
      if (S.sort === 'guests') return ((b.guests && b.guests.n) || 0) - ((a.guests && a.guests.n) || 0) || a.dist - b.dist;
      return a.dist - b.dist;
    });
    return list;
  }
  function card(p) {
    var pr = price(p);
    return '<article class="card" data-id="' + p.id + '">' +
      '<a class="card-link" href="#/p/' + p.id + '" aria-label="' + esc(p.name) + '">' +
        '<div class="ph">' + img(p, 0, 'thumb') + '<span class="num">' + p.n + '</span>' + distBadge(p) + '</div>' +
        '<div class="cb"><h3>' + esc(p.name) + '</h3><p class="where">' + icon('pin', 15) + esc(regionOf(p)) + '</p>' +
        '<p class="price' + (pr.known ? '' : ' tbc') + '">' + esc(pr.text) + '</p>' +
        '<p class="facts"><span>' + icon('users', 16) + esc(guestsText(p)) + '</span>' + (p.headline && p.headline.bedrooms ? '<span>' + icon('bed', 16) + p.headline.bedrooms + ' ' + esc(t('rooms')) + '</span>' : '') + (p.headline && p.headline.baths ? '<span>' + icon('bath', 16) + p.headline.baths + '</span>' : '') + '</p></div>' +
      '</a>' +
      '<div class="card-actions">' + likeBtn(p.id) + cmpBtn(p.id) + shareBtn(p.id) + '<a class="mapbtn" href="#/map/' + p.id + '" aria-label="' + esc(t('mapPin')) + '">' + icon('map', 18) + '</a></div></article>';
  }
  function renderPlaces() {
    var counts = { all: P.length, near: 0, mid: 0, far: 0 }; P.forEach(function (p) { counts[band(p)]++; });
    var b = META.bands, list = visiblePlaces();
    var chips = [['all', t('all'), ''], ['near', t('near'), t('nearR', { n: b.nearKm })], ['mid', t('mid'), t('midR', { a: b.nearKm, b: b.farKm })], ['far', t('far'), t('farR', { n: b.farKm })]].map(function (c) {
      return '<button type="button" class="chip band-' + c[0] + (S.band === c[0] ? ' on' : '') + '" data-band="' + c[0] + '" aria-pressed="' + (S.band === c[0]) + '"><b>' + esc(c[1]) + '</b><small>' + esc(c[2]) + '</small><em>' + counts[c[0]] + '</em></button>';
    }).join('');
    var facs = ['pool', 'bbq', 'karaoke'].map(function (k) {
      return '<button type="button" class="fchip' + (S.fac.indexOf(k) > -1 ? ' on' : '') + '" data-fac="' + k + '" aria-pressed="' + (S.fac.indexOf(k) > -1) + '">' + icon(AMX[k][3], 16) + esc(t('fac' + k.charAt(0).toUpperCase() + k.slice(1))) + '</button>';
    }).join('');
    view.innerHTML =
      '<section class="intro"><h1>' + esc(t('pickTitle')) + '</h1><p>' + icon('church', 16) + esc(t('tagline')) + '</p></section>' +
      '<section class="results" id="homeResults"></section>' +
      '<div class="bands" role="group">' + chips + '</div>' +
      '<div class="facs" role="group"><span class="lbl">' + esc(t('needFac')) + ':</span>' + facs + '</div>' +
      '<div class="bar"><p class="count">' + list.length + ' ' + esc(t('places')) + '</p>' +
      '<label class="sort"><span class="sr">' + esc(t('sort')) + '</span><select id="sort" aria-label="' + esc(t('sort')) + '">' +
        [['distance', 'sortDistance'], ['votes', 'sortVotes'], ['guests', 'sortGuests']].map(function (k) { return '<option value="' + k[0] + '"' + (S.sort === k[0] ? ' selected' : '') + '>' + esc(t(k[1])) + '</option>'; }).join('') + '</select></label></div>' +
      (list.length ? '<div class="grid">' + list.map(card).join('') + '</div>' : '<div class="empty"><p>' + esc(t('noMatch')) + '</p><button type="button" class="btn" data-clear>' + esc(t('clear')) + '</button></div>') +
      '<p class="ver">v2.1 · ' + P.length + ' ' + esc(t('places')) + '</p>';
  }

  /* ---------- DETAIL ---------- */
  function keyRow(label, rc) {
    return '<div class="row"><div class="rl">' + esc(label) + '</div><div class="rv">' + pill(rc.status, rc.qualifier) + (rc.value ? '<span class="val">' + esc(rc.value) + '</span>' : '') + (rc.note ? '<span class="rn">' + esc(rc.note) + '</span>' : '') + '</div></div>';
  }
  function bedChips(tt) {
    return ['king', 'queen', 'double', 'single', 'bunk', 'sofa_bed', 'floor_mattress', 'couch'].filter(function (k) { return tt[k]; }).map(function (k) { return '<span class="bchip">' + icon('bed', 14) + '<b>' + tt[k] + '</b> ' + esc(bedLabel(k)) + '</span>'; }).join('');
  }
  function accordion(id, title, body, open) { return '<details class="acc" id="acc-' + id + '"' + (open ? ' open' : '') + '><summary>' + esc(title) + '</summary><div class="acc-in">' + body + '</div></details>'; }
  function bedsBody(p) {
    if (p.units) {
      return '<div class="units">' + p.units.map(function (u) {
        var nm = S.lang === 'zh' ? (UNIT_ZH[u.id] || u.name) : u.name;
        return '<div class="unit"><h4>' + esc(nm) + ' <small>× ' + u.count + '</small></h4><div class="bchips">' + u.beds.map(function (b) { return '<span class="bchip">' + icon('bed', 14) + '<b>' + b.qty + '</b> ' + esc(b.note || bedLabel(b.type)) + '</span>'; }).join('') + '</div>' +
          '<p class="limit">' + esc(t('officialLimit', { a: u.maxAdults, c: u.maxChildren })) + '</p><p class="muted">' + esc(t('rateRange', { a: fmtRM(u.rates.weekday), b: fmtRM(u.rates.satPH) })) + '</p>' +
          '<p class="muted small">' + esc(u.bedNote) + '</p></div>';
      }).join('') + '</div>';
    }
    var st = bedStats(p), hasRooms = p.bedrooms && p.bedrooms.length;
    var nums = '<div class="three"><div><span>' + esc(t('bedCount')) + '</span><b>' + (p.bedroomsComplete ? st.units : '?') + '</b><small>' + esc(t('bedCountHint')) + '</small></div>' +
      '<div><span>' + esc(t('sleepSpots')) + '</span><b>' + (p.bedroomsComplete ? st.spots : '?') + '</b><small>' + (p.bedroomsComplete && st.floor ? '+ ' + st.floor + ' ' + esc(bedLabel('floor_mattress')) + ' · ' : '') + esc(t('sleepHint')) + '</small></div>' +
      '<div><span>' + esc(t('guestsAllowed')) + '</span><b class="sm">' + esc(p.maxGuests.display) + '</b>' + pill(p.maxGuests.status) + '</div></div>';
    var rooms = hasRooms ? '<div class="rooms">' + p.bedrooms.map(function (r) {
      var tt = {}; r.beds.forEach(function (b) { tt[b.type] = (tt[b.type] || 0) + b.qty; });
      return '<div class="room">' + (r.photo != null && p.photos[r.photo] ? '<button type="button" class="rph" data-lb="' + r.photo + '" aria-label="' + esc(r.name) + '">' + img(p, r.photo, 'thumb') + '</button>' : '') + '<div><h4>' + esc(r.name) + '</h4><div class="bchips">' + bedChips(tt) + '</div></div></div>';
    }).join('') + '</div>' : '';
    var types = p.roomTypes ? '<div class="types">' + p.roomTypes.map(function (r) { return '<div><b>' + r.count + '</b> ' + esc(r.name) + ' — <span class="muted">' + esc(r.desc) + '</span></div>'; }).join('') + '</div>' : '';
    var notes = (p.sleepingNotes || []).length ? '<ul class="notes">' + p.sleepingNotes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : '';
    return nums + rooms + types + notes + '<p class="muted small">' + esc(p.maxGuests.note) + '</p>';
  }
  function facilitiesBody(p) {
    return AM_GROUPS.map(function (g) {
      return '<h4 class="sub">' + esc(S.lang === 'zh' ? g[2] : g[1]) + '</h4><div class="am-grid">' + AM.filter(function (a) { return a[4] === g[0]; }).map(function (a) {
        var r = rec(p.amenities, a[0]);
        return '<div class="am ' + STATUS[r.status].cls + '"><div class="am-h">' + icon(a[3], 18) + '<span>' + esc(S.lang === 'zh' ? a[2] : a[1]) + '</span></div>' + pill(r.status, r.qualifier) + (r.note ? '<p>' + esc(r.note) + '</p>' : '') + '</div>';
      }).join('') + '</div>';
    }).join('');
  }
  function rowsBody(rows, obj) { return '<div class="rows">' + rows.map(function (r) { return keyRow(lab(r), rec(obj, r[0])); }).join('') + '</div>'; }
  function priceBody(p) {
    var items = (p.pricing && p.pricing.items) || {};
    var rows = PRICE_ROWS.filter(function (r) { return r[0] !== 'meals' || items.meals; });
    var tbl = '';
    if (p.units) {
      tbl = '<h4 class="sub">' + esc(t('ratesTitle')) + '</h4><div class="rate-table"><div class="rt h"><span></span><span>' + esc(t('tier1')) + '</span><span>' + esc(t('tier2')) + '</span><span>' + esc(t('tier3')) + '</span></div>' +
        p.units.map(function (u) { return '<div class="rt"><span><b>' + esc(S.lang === 'zh' ? (UNIT_ZH[u.id] || u.short) : u.short) + '</b></span><span>' + fmtRM(u.rates.weekday) + '</span><span>' + fmtRM(u.rates.friSun) + '</span><span>' + fmtRM(u.rates.satPH) + '</span></div>'; }).join('') + '</div>';
    }
    var head = '<div class="note warn"><div><b>' + esc(t('priceDisclaimer')) + '</b><span>' + esc((p.pricing && p.pricing.note) || '') + '</span></div></div>';
    return head + '<div class="rows">' + rows.map(function (r) { return keyRow(lab(r), rec(items, r[0])); }).join('') + '</div>' + tbl;
  }
  function renderDetail(p) {
    var pr = price(p);
    var good = listOf(p, 'pros'), watchL = listOf(p, 'cautions'), todo = listOf(p, 'openItems'), rules = rulesOf(p);
    var strip = p.photos.length
      ? '<div class="strip">' + p.photos.map(function (ph, i) { return '<button type="button" class="slide" data-lb="' + i + '" aria-label="' + esc(t('photosOf', { i: i + 1, n: p.photos.length })) + '">' + img(p, i, i === 0 ? 'large' : 'thumb') + '</button>'; }).join('') + '</div><p class="muted small count">' + p.photos.length + ' ' + esc(t('photoCount')) + '</p>'
      : '<div class="strip"><div class="slide">' + img(p, 0) + '</div></div>';
    var keys = ['pool', 'bbq', 'karaoke', 'kitchen', 'parking', 'aircon'].map(function (k) {
      var r = rec(p.amenities, k), s = STATUS[r.status];
      return '<div class="kf ' + s.cls + '">' + icon(AMX[k][3], 20) + '<span>' + esc(amLabel(k)) + '</span><i>' + s.g + '</i></div>';
    }).join('');
    var rating = p.rating ? '<span class="rate">★ ' + p.rating.score + ' <small>(' + p.rating.reviews + ' ' + esc(t('reviews')) + ')</small></span>' : '';
    var picked = Soc.mine.pick === p.id;
    return '<article class="detail" data-id="' + p.id + '">' +
      '<a class="back" href="#/places">' + icon('back', 18) + esc(t('back')) + '</a>' + strip +
      '<header class="dh"><div class="row1"><span class="num lg">' + p.n + '</span>' + distBadge(p) + rating + '</div><h2>' + esc(p.name) + '</h2>' +
      '<p class="where">' + icon('pin', 16) + esc(regionOf(p)) + '</p><p class="muted small">' + esc(typeOf(p)) + '</p>' +
      '<p class="sum">' + esc(summaryOf(p)) + '</p></header>' +
      '<div class="nums"><div class="n1"><span>' + esc(t('rowPrice')) + '</span><b class="' + (pr.known ? '' : 'tbc') + '">' + esc(pr.text) + '</b>' + (pr.known ? '<small>' + esc(t('gross')) + '</small>' : '') + '</div>' +
      '<div><span>' + icon('users', 15) + esc(t('rowGuests')) + '</span><b>' + esc(guestsText(p)) + '</b></div>' +
      '<div><span>' + icon('bed', 15) + esc(t('beds')) + '</span><b>' + (p.units ? '—' : esc(bedsText(p))) + '</b></div>' +
      '<div><span>' + icon('bath', 15) + esc(t('baths')) + '</span><b>' + (p.headline && p.headline.baths != null ? p.headline.baths : (p.units ? '1 / ' + esc(t('perUnit')) : '?')) + '</b></div></div>' +
      '<div class="geo"><p>' + icon('route', 16) + esc(t('straight')) + '</p><div class="geo-b"><a class="btn" href="' + esc(dirUrl(p)) + '" target="_blank" rel="noopener noreferrer">' + icon('route', 16) + esc(t('directions')) + '</a><a class="btn ghost" href="' + esc(p.location.gmaps) + '" target="_blank" rel="noopener noreferrer">' + icon('pin', 16) + esc(t('openMaps')) + '</a><a class="btn ghost" href="#/map/' + p.id + '">' + icon('map', 16) + esc(t('mapPin')) + '</a>' + cmpBtn(p.id, true) + '</div></div>' +
      (good.length ? '<section class="pc good"><h3>' + esc(t('good')) + '</h3><ul>' + good.slice(0, 4).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>' : '') +
      (watchL.length ? '<section class="pc watch"><h3>' + esc(t('watch')) + '</h3><ul>' + watchL.slice(0, 4).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>' : '') +
      '<section><h3 class="h">' + esc(t('keyFac')) + '</h3><div class="kfs">' + keys + '</div></section>' +
      '<section class="more"><h3 class="h">' + esc(t('more')) + '</h3><p class="muted small">' + esc(t('english')) + '</p>' +
        accordion('beds', t('secBeds'), bedsBody(p)) +
        (Object.keys(p.bathrooms || {}).length ? accordion('baths', t('secBaths'), rowsBody(BATH_ROWS, p.bathrooms)) : '') +
        accordion('fac', t('secFac'), facilitiesBody(p)) +
        (Object.keys(p.kitchen || {}).length ? accordion('kit', t('secKitchen'), rowsBody(KITCHEN_ROWS, p.kitchen)) : '') +
        accordion('price', t('secPrice'), priceBody(p)) +
        (rules.length ? accordion('rules', t('secRules'), '<div class="rules">' + rules.map(function (r) { return '<div class="rule ' + esc(r.tone || '') + '"><b>' + esc(r.title) + '</b><span>' + esc(r.body) + '</span></div>'; }).join('') + '</div>', p.id === 'dusun_bonda') : '') +
        accordion('todo', t('secTodo'), '<ul class="todo">' + todo.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>') +
        accordion('links', t('secLinks'), '<div class="links">' + p.links.map(function (l) { return '<a class="btn" href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' + icon('link', 15) + esc(l.label) + '</a>'; }).join('') + '</div>') +
      '</section>' +
      '<section class="qa" id="qa"><h3 class="h">' + icon('chat', 18) + esc(t('askTitle')) + '</h3><div id="qaNote"></div><div id="qaList"></div>' + qaForm(p.id) + '</section>' +
      '</article>' +
      '<div class="actions" role="group">' + likeBtn(p.id, 'big') + '<button type="button" class="pickbtn' + (picked ? ' on' : '') + '" data-pick="' + p.id + '" aria-pressed="' + picked + '">' + icon('star', 18) + '<span>' + esc(picked ? t('picked') : t('pick')) + '</span></button>' + shareBtn(p.id) + '<button type="button" class="askbtn" data-askjump>' + icon('chat', 18) + '<span>' + esc(t('ask')) + '</span></button></div>';
  }
  function qaForm(id) {
    return '<form class="qform" data-qform="' + id + '" autocomplete="off">' + (LOGIN ? '<div class="postas" data-postas>' + postAsHtml() + '</div>' : '<label><span>' + esc(t('yourName')) + '</span><input type="text" name="name" maxlength="40" value="' + esc(S.name) + '"></label>') +
      '<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<label><span>' + esc(t('yourQ')) + '</span><textarea name="text" rows="3" maxlength="600" required></textarea></label>' +
      '<button type="submit" class="btn primary">' + esc(t('send')) + '</button></form>';
  }
  function commentHtml(c) {
    var d = ''; try { d = new Date(c.time).toLocaleDateString(S.lang === 'zh' ? 'zh-CN' : 'en-GB', { day: 'numeric', month: 'short' }); } catch (e) { d = ''; }
    var tag = '';
    if (current.v === 'talk') tag = c.id === 'general' ? '<span class="tag">' + esc(t('general')) + '</span>' : (BY[c.id] ? '<a class="tag" href="#/p/' + c.id + '">' + esc(BY[c.id].name) + '</a>' : '');
    return '<div class="cm"><div class="cm-h"><b>' + esc(c.name || t('anon')) + '</b>' + tag + '<small>' + esc(d) + '</small></div><p>' + esc(c.text) + '</p>' + (c.reply ? '<div class="rp"><b>' + esc(t('reply')) + ':</b> ' + esc(c.reply) + '</div>' : '') + '</div>';
  }
  function socialNote() {
    return '<p class="snote ' + (Soc.shared && !Soc.offline ? 'ok' : 'warn') + '">' + esc(Soc.shared ? (Soc.offline ? t('offlineNote') : t('sharedNote')) : t('localNote')) + '</p>';
  }

  /* ---------- COMPARE ---------- */
  function renderCompare() {
    var list = S.compare.map(function (id) { return BY[id]; }).filter(Boolean);
    var people = parseInt(S.people || CFG.participants, 10) || 0;
    var head = '<section class="intro"><h1>' + esc(t('compareTitle')) + '</h1><p>' + esc(t('compareHint')) + '</p></section>';
    if (list.length < 1) { view.innerHTML = head + '<div class="empty"><p>' + esc(t('compareEmpty')) + '</p><a class="btn primary" href="#/places">' + esc(t('tabPlaces')) + '</a></div>'; return; }
    var rows = [
      ['', function (p) { return '<div class="ch"><a href="#/p/' + p.id + '"><div class="ph sm">' + img(p, 0, 'thumb') + '<span class="num">' + p.n + '</span></div><b>' + esc(p.name) + '</b></a><button type="button" class="x" data-cmp="' + p.id + '" aria-label="' + esc(t('compareRemove')) + '">' + icon('x', 16) + '</button></div>'; }],
      [t('rowDistance'), function (p) { return distBadge(p); }],
      [t('rowPrice'), function (p) { var pr = price(p); return '<b class="' + (pr.known ? '' : 'tbc') + '">' + esc(pr.text) + '</b>'; }],
      [t('perPerson'), function (p) { var tot = p.pricing && p.pricing.total; if (tot > 0 && people) return '<b>' + fmtRM2(tot / people) + '</b>'; if (p.pricing && p.pricing.perPerson) return '<b>RM' + p.pricing.perPerson.min + '–' + p.pricing.perPerson.max + '</b>'; return '<span class="muted">' + (tot > 0 ? esc(t('perPersonHint')) : '—') + '</span>'; }],
      [t('rowGuests'), function (p) { return '<b>' + esc(guestsText(p)) + '</b>'; }],
      [t('rowRooms'), function (p) { return p.headline ? p.headline.bedrooms + ' ' + esc(t('rooms')) + ' · ' + p.headline.beds + ' ' + esc(t('beds')) : (p.units ? p.units.length + ' ' + esc(t('units')) : '?'); }],
      [t('rowBaths'), function (p) { return p.headline && p.headline.baths != null ? String(p.headline.baths) : (p.units ? '1 / ' + esc(t('perUnit')) : '?'); }],
      [t('rowPool'), function (p) { return pill(amStatus(p, 'pool')); }],
      [t('rowBbq'), function (p) { return pill(amStatus(p, 'bbq')); }],
      [t('rowKaraoke'), function (p) { return pill(amStatus(p, 'karaoke')); }],
      [t('rowVotes'), function (p) { return '♥ ' + likeCount(p.id) + (Soc.picks[p.id] ? ' · ★ ' + Soc.picks[p.id] : ''); }]
    ];
    view.innerHTML = head +
      '<label class="people"><span>' + esc(t('people')) + '</span><input type="number" id="people" min="1" inputmode="numeric" value="' + esc(S.people || CFG.participants || '') + '" placeholder="20"></label>' +
      '<div class="cmp-wrap"><table class="cmp"><tbody>' + rows.map(function (r) {
        return '<tr><th scope="row">' + esc(r[0]) + '</th>' + list.map(function (p) { return '<td>' + r[1](p) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* ---------- VOTES & Q&A ---------- */
  function renderTalk() {
    view.innerHTML = '<section class="intro"><h1>' + esc(t('talkTitle')) + '</h1></section><div id="talkNote"></div><p class="namebox" data-namebox>' + nameBoxHtml() + '</p>' +
      '<section><h3 class="h">' + icon('star', 18) + esc(t('ranking')) + '</h3><p class="muted small">' + esc(t('rankHint')) + '</p><div id="rankList"></div></section>' +
      '<section class="qa"><h3 class="h">' + icon('chat', 18) + esc(t('questions')) + '</h3><div id="talkList"></div><h4 class="sub">' + esc(t('askGeneral')) + '</h4>' + qaForm('general') + '</section>';
  }
  function rankHtml() {
    var ranked = P.filter(function (p) { return likeCount(p.id) || (Soc.picks[p.id] || 0); }).sort(function (a, b) { return ((Soc.picks[b.id] || 0) - (Soc.picks[a.id] || 0)) || (likeCount(b.id) - likeCount(a.id)) || a.dist - b.dist; });
    if (!ranked.length) return '<p class="muted">—</p>';
    return '<ol class="rank">' + ranked.map(function (p) { return '<li><a href="#/p/' + p.id + '"><span class="num">' + p.n + '</span><b>' + esc(p.name) + '</b></a><span class="sc">★ ' + (Soc.picks[p.id] || 0) + ' ' + esc(t('picksLabel')) + ' · ♥ ' + likeCount(p.id) + '</span></li>'; }).join('') + '</ol>';
  }
  function resultsHtml() {
    var ranked = P.filter(function (p) { return likeCount(p.id) || (Soc.picks[p.id] || 0); }).sort(function (a, b) { return ((Soc.picks[b.id] || 0) - (Soc.picks[a.id] || 0)) || (likeCount(b.id) - likeCount(a.id)) || a.dist - b.dist; }).slice(0, 3);
    var head = '<div class="res-h"><h2>' + icon('star', 18) + esc(t('resTitle')) + '</h2><a href="#/talk">' + esc(t('resAll')) + '</a></div>';
    if (!ranked.length) return head + '<p class="muted small">' + esc(t('resNone')) + '</p>';
    var byVotes = ranked.some(function (p) { return Soc.picks[p.id]; });
    var max = Math.max.apply(null, ranked.map(function (p) { return byVotes ? (Soc.picks[p.id] || 0) : likeCount(p.id); }).concat(1));
    return head + ranked.map(function (p, i) {
      var v = Soc.picks[p.id] || 0, l = likeCount(p.id), w = Math.max(6, Math.round((byVotes ? v : l) / max * 100));
      return '<a class="res-row" href="#/p/' + p.id + '"><span class="num">' + p.n + '</span><span class="res-main"><b>' + esc(p.name) + '</b><span class="res-bar"><i style="width:' + w + '%"></i></span></span><span class="res-n">★ ' + v + ' ' + esc(t(v === 1 ? 'voteWord' : 'votesWord')) + '<br>♥ ' + l + '</span></a>';
    }).join('');
  }
  /* update only the parts that show votes and questions (keeps typing and scroll position) */
  function refreshSocial() {
    var hr = $('#homeResults'); if (hr) hr.innerHTML = resultsHtml();
    $$('[data-likecount]').forEach(function (el) { el.textContent = likeCount(el.getAttribute('data-likecount')); });
    $$('[data-like]').forEach(function (b) { var on = isLiked(b.getAttribute('data-like')); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    $$('[data-pick]').forEach(function (b) { var on = Soc.mine.pick === b.getAttribute('data-pick'); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); var sp = $('span', b); if (sp) sp.textContent = t(on ? 'picked' : 'pick'); });
    var rl = $('#rankList'); if (rl) rl.innerHTML = rankHtml();
    var tn = $('#talkNote'); if (tn) tn.innerHTML = socialNote();
    var qn = $('#qaNote'); if (qn) qn.innerHTML = socialNote();
    var tl = $('#talkList'); if (tl) { var all = Soc.comments.slice().reverse(); tl.innerHTML = all.length ? all.map(commentHtml).join('') : '<p class="muted">' + esc(t('noQ')) + '</p>'; }
    var ql = $('#qaList'); if (ql && current.v === 'detail') { var mine = Soc.comments.filter(function (c) { return c.id === current.id; }).reverse(); ql.innerHTML = mine.length ? mine.map(commentHtml).join('') : '<p class="muted">' + esc(t('noQ')) + '</p>'; }
  }

  /* ---------- MAP ---------- */
  var mapObj = null, mapFailed = false, tilesOk = 0, tilesBad = 0, selected = null, nearBounds = null, allBounds = null, mapMode = 'near';
  function renderMapUI() {
    var b = META.bands;
    mapView.querySelector('.mapui').innerHTML =
      '<div class="seg" role="group"><button type="button" data-mapmode="near" class="' + (mapMode === 'near' ? 'on' : '') + '">' + esc(t('mapNear')) + '</button><button type="button" data-mapmode="all" class="' + (mapMode === 'all' ? 'on' : '') + '">' + esc(t('mapAll')) + '</button></div>' +
      '<div class="legend"><span><i class="church-i">' + icon('church', 12) + '</i>' + esc(t('legendChurch')) + '</span><span><i class="band-near"></i>' + esc(t('near')) + ' ' + esc(t('nearR', { n: b.nearKm })) + '</span><span><i class="band-mid"></i>' + esc(t('mid')) + ' ' + esc(t('midR', { a: b.nearKm, b: b.farKm })) + '</span><span><i class="band-far"></i>' + esc(t('far')) + ' ' + esc(t('farR', { n: b.farKm })) + '</span></div>';
    if (selected) showSheet(selected);
  }
  function sheetHtml(p) {
    var pr = price(p);
    return '<button type="button" class="sx" data-sheetclose aria-label="' + esc(t('close')) + '">' + icon('x', 18) + '</button><div class="sh"><div class="ph sm">' + img(p, 0, 'thumb') + '<span class="num">' + p.n + '</span></div><div class="si"><h3>' + esc(p.name) + '</h3><p class="where">' + esc(regionOf(p)) + '</p><p>' + distBadge(p) + '</p><p class="price' + (pr.known ? '' : ' tbc') + '">' + esc(pr.text) + '</p></div></div>' +
      '<div class="sa"><a class="btn primary" href="#/p/' + p.id + '">' + esc(t('details')) + '</a>' + likeBtn(p.id) + shareBtn(p.id) + '<a class="btn ghost" href="' + esc(dirUrl(p)) + '" target="_blank" rel="noopener noreferrer">' + icon('route', 16) + esc(t('directions')) + '</a></div>';
  }
  function showSheet(id) {
    selected = id; var el = $('#sheet'); el.innerHTML = sheetHtml(BY[id]); el.hidden = false;
    $$('.mdot').forEach(function (d) { d.classList.toggle('sel', +d.getAttribute('data-n') === BY[id].n); });
  }
  function hideSheet() { selected = null; $('#sheet').hidden = true; $$('.mdot').forEach(function (d) { d.classList.remove('sel'); }); }
  function fitMap() { if (!mapObj) return; mapObj.invalidateSize(); mapObj.fitBounds(mapMode === 'all' ? allBounds : nearBounds, { padding: [24, 24] }); }
  function initMap() {
    if (mapObj || mapFailed) return;
    if (!window.L) { mapFailed = true; mapFallback(); return; }
    mapObj = L.map('mapbox', { zoomControl: true });
    var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' });
    osm.on('tileload', function () { tilesOk++; }); osm.on('tileerror', function () { tilesBad++; });
    osm.addTo(mapObj);
    var o = [ORIGIN.lat, ORIGIN.lng];
    [50, 100, 200].forEach(function (r) {
      L.circle(o, { radius: r * 1000, color: '#7b8294', weight: 1.2, dashArray: '5 7', fill: false, interactive: false }).addTo(mapObj);
      L.marker([ORIGIN.lat + r / 111, ORIGIN.lng], { icon: L.divIcon({ className: 'ring-label', html: '<span>' + r + ' km</span>', iconSize: [0, 0] }), interactive: false, keyboard: false }).addTo(mapObj);
    });
    L.marker(o, { icon: L.divIcon({ className: 'mk', iconSize: [0, 0], iconAnchor: [0, 0], html: '<span class="church-pin">' + icon('church', 18) + '</span><span class="church-lab">' + esc(t('church')) + '</span>' }), title: ORIGIN.name, zIndexOffset: 2000 }).addTo(mapObj);
    var near = [o], all = [o];
    P.forEach(function (p) {
      var ll = [p.location.lat, p.location.lng]; all.push(ll); if (p.dist <= META.bands.farKm) near.push(ll);
      var m = L.marker(ll, { icon: L.divIcon({ className: 'mk', iconSize: [0, 0], iconAnchor: [0, 0], html: '<span class="mdot band-' + band(p) + '" data-n="' + p.n + '"><b>' + p.n + '</b></span>' }), title: p.n + '. ' + p.name, keyboard: true }).addTo(mapObj);
      m.on('click', function () { showSheet(p.id); });
    });
    nearBounds = L.latLngBounds(near); allBounds = L.latLngBounds(all);
    mapObj.on('click', hideSheet);
    mapObj.fitBounds(nearBounds, { padding: [24, 24] });
    if (window.ResizeObserver) new ResizeObserver(function () { if (mapObj) mapObj.invalidateSize(); }).observe($('#mapbox'));
    setTimeout(function () { if (!tilesOk && tilesBad) { mapFailed = true; mapFallback(); } }, 6000);
  }
  function mapFallback() {
    var list = P.slice().sort(function (a, b) { return a.dist - b.dist; }), max = list[list.length - 1].dist;
    var box = $('#mapbox'); box.classList.add('fallback'); mapView.classList.add('fb');
    box.innerHTML = '<div class="ladder"><p class="note warn">' + esc(t('mapFail')) + '</p>' + list.map(function (p) {
      return '<a class="lad" href="#/p/' + p.id + '"><span class="num">' + p.n + '</span><span class="lname">' + esc(p.name) + '</span><span class="lbar"><i class="band-' + band(p) + '" style="width:' + Math.max(4, Math.round(p.dist / max * 100)) + '%"></i></span><span class="lk">' + distKm(p) + ' km</span></a>';
    }).join('') + '</div>';
  }
  function whenLeaflet(cb) {
    if (window.L) { cb(); return; }
    var done = false, s = $('#leaflet-js'); function fin() { if (!done) { done = true; cb(); } }
    if (s) { s.addEventListener('load', fin); s.addEventListener('error', fin); } setTimeout(fin, 4000);
  }

  /* ---------- lightbox ---------- */
  var lb = { id: null, i: 0, open: false };
  function openLB(id, i) { lb = { id: id, i: i, open: true }; renderLB(); $('#lightbox').hidden = false; document.body.classList.add('noscroll'); $('#lbClose').focus(); }
  function closeLB() { lb.open = false; $('#lightbox').hidden = true; document.body.classList.remove('noscroll'); }
  function renderLB() { var p = BY[lb.id]; $('#lbImg').innerHTML = img(p, lb.i, 'large'); $('#lbCap').textContent = capText(p.photos[lb.i]) + ' · ' + (lb.i + 1) + ' / ' + p.photos.length; }
  function lbStep(d) { var n = BY[lb.id].photos.length; lb.i = (lb.i + d + n) % n; renderLB(); }

  /* ---------- router ---------- */
  function parse() {
    var a = (location.hash || '').replace(/^#\/?/, '').split('/');
    if (a[0] === 'p' && BY[a[1]]) return { v: 'detail', id: a[1] };
    if (a[0] === 'map') return { v: 'map', focus: BY[a[1]] ? a[1] : null };
    if (a[0] === 'compare') return { v: 'compare' };
    if (a[0] === 'talk') return { v: 'talk' };
    return { v: 'places' };
  }
  function renderNav() {
    var items = [['places', 'tabPlaces', 'list'], ['map', 'tabMap', 'map'], ['compare', 'tabCompare', 'scale'], ['talk', 'tabTalk', 'chat']];
    $('#nav').innerHTML = items.map(function (it) {
      var on = current.v === it[0] || (it[0] === 'places' && current.v === 'detail');
      var badge = it[0] === 'compare' && S.compare.length ? '<em>' + S.compare.length + '</em>' : '';
      return '<a href="#/' + it[0] + '"' + (on ? ' class="on" aria-current="page"' : '') + '>' + icon(it[2], 22) + '<span>' + esc(t(it[1])) + '</span>' + badge + '</a>';
    }).join('');
    $('#langbox').innerHTML = ['en', 'zh'].map(function (l) { return '<button type="button" data-lang="' + l + '" class="' + (S.lang === l ? 'on' : '') + '" aria-pressed="' + (S.lang === l) + '">' + (l === 'en' ? 'EN' : '中') + '</button>'; }).join('');
    $('#brand').textContent = t('brand');
    renderAccount();
    document.documentElement.lang = S.lang === 'zh' ? 'zh-CN' : 'en';
    document.title = t('title');
  }
  function render() {
    current = parse(); renderNav();
    var isMap = current.v === 'map';
    mapView.hidden = !isMap; view.hidden = isMap;
    document.body.classList.toggle('on-map', isMap); document.body.classList.toggle('on-detail', current.v === 'detail');
    if (isMap) {
      renderMapUI();
      if (!mapObj && !mapFailed) { $('#mapbox').innerHTML = '<p class="loading">' + esc(t('loadingMap')) + '</p>'; whenLeaflet(function () { $('#mapbox').innerHTML = ''; initMap(); afterMapShown(); }); } else afterMapShown();
      return;
    }
    if (current.v === 'detail') view.innerHTML = renderDetail(BY[current.id]);
    else if (current.v === 'compare') renderCompare();
    else if (current.v === 'talk') renderTalk();
    else renderPlaces();
    refreshSocial();
    window.scrollTo(0, 0);
  }
  function afterMapShown() {
    if (!mapObj) return;
    setTimeout(function () {
      mapObj.invalidateSize();
      if (current.focus) { var p = BY[current.focus]; mapObj.setView([p.location.lat, p.location.lng], 11); showSheet(current.focus); } else { fitMap(); }
    }, 60);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-lang],[data-band],[data-fac],[data-clear],[data-like],[data-pick],[data-cmp],[data-lb],[data-askjump],[data-mapmode],[data-sheetclose],[data-share],[data-copy],[data-modalclose],[data-namesave],[data-namechange],[data-signin],[data-signout],[data-account]') : null;
    if (!el) return;
    if (el.hasAttribute('data-lang')) { S.lang = el.getAttribute('data-lang'); save(); render(); return; }
    if (el.hasAttribute('data-band')) { S.band = el.getAttribute('data-band'); save(); renderPlaces(); refreshSocial(); return; }
    if (el.hasAttribute('data-fac')) { var k = el.getAttribute('data-fac'); S.fac = S.fac.indexOf(k) > -1 ? S.fac.filter(function (x) { return x !== k; }) : S.fac.concat(k); save(); renderPlaces(); refreshSocial(); return; }
    if (el.hasAttribute('data-clear')) { S.band = 'all'; S.fac = []; save(); renderPlaces(); refreshSocial(); return; }
    if (el.hasAttribute('data-like')) { e.preventDefault(); toggleLike(el.getAttribute('data-like')); return; }
    if (el.hasAttribute('data-pick')) { setPick(el.getAttribute('data-pick')); return; }
    if (el.hasAttribute('data-cmp')) {
      e.preventDefault(); var id = el.getAttribute('data-cmp'), i = S.compare.indexOf(id);
      if (i > -1) S.compare.splice(i, 1); else { S.compare.push(id); if (S.compare.length > 3) { S.compare.shift(); toast(t('compareMax')); } }
      save(); renderNav();
      $$('[data-cmp="' + id + '"]').forEach(function (b) { var on = S.compare.indexOf(id) > -1; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
      if (current.v === 'compare') renderCompare();
      return;
    }
    if (el.hasAttribute('data-lb')) { openLB(current.id, parseInt(el.getAttribute('data-lb'), 10)); return; }
    if (el.hasAttribute('data-askjump')) { var q = $('#qa'); if (q) { q.scrollIntoView({ behavior: 'smooth', block: 'start' }); var ta = $('textarea', q); if (ta) setTimeout(function () { ta.focus({ preventScroll: true }); }, 400); } return; }
    if (el.hasAttribute('data-mapmode')) { mapMode = el.getAttribute('data-mapmode'); renderMapUI(); fitMap(); return; }
    if (el.hasAttribute('data-sheetclose')) { hideSheet(); return; }
    if (el.hasAttribute('data-share')) { e.preventDefault(); openShare(el.getAttribute('data-share')); return; }
    if (el.hasAttribute('data-copy')) { copyShare(); return; }
    if (el.hasAttribute('data-modalclose')) { closeModal(); return; }
    if (el.hasAttribute('data-namesave')) { saveName(); return; }
    if (el.hasAttribute('data-namechange')) { askName(null); return; }
    if (el.hasAttribute('data-signin')) { openSignIn(null); return; }
    if (el.hasAttribute('data-signout')) { signOut(); return; }
    if (el.hasAttribute('data-account')) { openAccount(); return; }
  });
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (!modal.hidden) { if (e.key === 'Escape') closeModal(); else if (e.key === 'Enter' && e.target.id === 'nameInput') saveName(); } });
  document.addEventListener('change', function (e) { if (e.target.id === 'sort') { S.sort = e.target.value; save(); renderPlaces(); refreshSocial(); } });
  document.addEventListener('input', function (e) {
    if (e.target.id !== 'people') return;
    S.people = e.target.value; save(); renderCompare();
    var el = $('#people'); if (el) { el.focus(); var v = el.value; el.value = ''; el.value = v; }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f.hasAttribute || !f.hasAttribute('data-qform')) return;
    e.preventDefault();
    var id = f.getAttribute('data-qform'), nameEl = f.elements.name, name = nameEl ? nameEl.value.trim() : '', text = f.elements.text.value.trim(), btn = $('button[type=submit]', f);
    if (f.elements.website.value || !text) return;
    var resubmit = function () { if (nameEl) nameEl.value = S.name; f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit', { cancelable: true })); };
    if (LOGIN) { if (!S.auth.session) { openSignIn(resubmit); return; } name = ''; }
    else { if (!name && !S.name) { askName(resubmit); return; } if (name) { S.name = name; save(); } }
    btn.disabled = true;
    Promise.resolve(addComment(id, name, text)).then(function () { f.elements.text.value = ''; toast(t('sent')); }).catch(function () { toast(t('sendFail')); }).then(function () { setTimeout(function () { btn.disabled = false; }, 1500); });
  });
  document.addEventListener('keydown', function (e) {
    if (!lb.open) return;
    if (e.key === 'Escape') closeLB(); else if (e.key === 'ArrowRight') lbStep(1); else if (e.key === 'ArrowLeft') lbStep(-1);
  });
  $('#lbClose').addEventListener('click', closeLB);
  $('#lbPrev').addEventListener('click', function () { lbStep(-1); });
  $('#lbNext').addEventListener('click', function () { lbStep(1); });
  $('#lightbox').addEventListener('click', function (e) { if (e.target.id === 'lightbox') closeLB(); });
  window.addEventListener('hashchange', render);

  /* ---------- start ---------- */
  localSummary();
  loadGIS();
  render();
  socLoad();
  if (Soc.shared) {
    setInterval(function () { if (!document.hidden) socLoad(); }, 60000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) socLoad(); });
  }
  window.__c26 = { data: DATA, S: S, Soc: Soc, version: 2 };
})();
