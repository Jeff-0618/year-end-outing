/* YEAR-END COUNTDOWN 2026 — interactive accommodation map
   All content comes from data/properties.js. No build step. */
(function () {
  'use strict';
  /* Hosted-preview mode (set by the single-file build): no outside photos, no map tiles. */
  var HOSTED = !!window.__HOSTED__;
  if (HOSTED) document.documentElement.classList.add('hosted');

  var DATA = window.PROPERTIES_DATA;
  if (!DATA || !DATA.properties) {
    document.body.innerHTML = '<p style="padding:2rem;font:16px system-ui;color:#f4ecdc">data/properties.js did not load. Check that the file exists next to index.html.</p>';
    return;
  }
  var P = DATA.properties;
  var META = DATA.meta;
  var BY_ID = {};
  P.forEach(function (p, i) { BY_ID[p.id] = p; p._i = i; p._badge = 'ABCD'.charAt(i) || String(i + 1); });

  /* ---------- small helpers ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var fmtRM = function (n) { return 'RM' + Number(n).toLocaleString('en-MY', { maximumFractionDigits: 2 }); };
  var fmtRM2 = function (n) { return 'RM' + Number(n).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };

  /* ---------- persisted UI state (headcount, totals, tally, notes) ---------- */
  var KEY = 'countdown2026.state.v1';
  var state = { headcount: '', totals: {}, votes: {}, checked: {}, notes: '', filters: [], selected: null, tier: 'satPH', builder: { studio: 1, glam5: 0, glam4: 0 } };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') { Object.keys(saved).forEach(function (k) { state[k] = saved[k]; }); }
  } catch (e) { /* storage unavailable: keep in memory */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }

  /* ---------- icons ---------- */
  var IC = {
    bed: '<path d="M3 19V6"/><path d="M3 14h18v5"/><path d="M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/>',
    bath: '<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M7 19l-1 2M17 19l1 2"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M17 14c2.5 0 4 2 4 4.5"/>',
    door: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><circle cx="15" cy="12" r="1"/>',
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
    tent: '<path d="M3 20L12 4l9 16z"/><path d="M12 20l-3-6h6z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'
  };
  function icon(name, size) {
    size = size || 20;
    return '<svg class="ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[name] || IC.spark) + '</svg>';
  }

  /* ---------- status vocabulary (exactly the five states from the brief) ---------- */
  var STATUS = {
    confirmed: { label: 'Confirmed', cls: 'ok', glyph: '✓' },
    not_provided: { label: 'Not provided', cls: 'no', glyph: '✕' },
    not_disclosed: { label: 'Not disclosed', cls: 'nd', glyph: '–' },
    additional_charge: { label: 'Additional charge', cls: 'fee', glyph: '$' },
    need_confirmation: { label: 'Need confirmation', cls: 'nc', glyph: '?' }
  };
  function pill(status, qualifier) {
    var s = STATUS[status] || STATUS.not_disclosed;
    return '<span class="pill ' + s.cls + '"><i aria-hidden="true">' + s.glyph + '</i>' + s.label + (qualifier ? ' · ' + esc(qualifier) : '') + '</span>';
  }
  function rec(obj, key) {
    var r = obj && obj[key];
    return r ? r : { status: 'not_disclosed' };
  }

  var AMENITIES = [
    ['pool', 'Swimming pool', 'pool', 'fun'], ['bbq', 'BBQ facilities', 'bbq', 'fun'], ['karaoke', 'Karaoke', 'mic', 'fun'],
    ['mahjong', 'Mahjong', 'dice', 'fun'], ['boardgames', 'Board games', 'dice', 'fun'], ['gaming', 'Gaming facilities', 'gamepad', 'fun'],
    ['projector', 'Projector / meeting space', 'screen', 'fun'], ['other', 'Other entertainment', 'spark', 'fun'],
    ['living', 'Living hall', 'sofa', 'space'], ['dining', 'Dining area', 'utensils', 'space'],
    ['garden', 'Garden', 'tree', 'nature'], ['river', 'River', 'water', 'nature'], ['waterfall', 'Waterfall', 'water', 'nature'],
    ['playground', 'Playground', 'slide', 'nature'], ['outdoor', 'Outdoor activities', 'mountain', 'nature'],
    ['kitchen', 'Kitchen', 'pot', 'kitchen'], ['fridge', 'Refrigerator', 'fridge', 'kitchen'], ['microwave', 'Microwave', 'microwave', 'kitchen'],
    ['ricecooker', 'Rice cooker', 'rice', 'kitchen'], ['stove', 'Stove', 'stove', 'kitchen'], ['utensils', 'Cooking utensils', 'pot', 'kitchen'],
    ['plates', 'Plates & cutlery', 'plate', 'kitchen'], ['waterdisp', 'Water dispenser', 'dispenser', 'kitchen'],
    ['wifi', 'Wi-Fi', 'wifi', 'comfort'], ['aircon', 'Air conditioning', 'snow', 'comfort'], ['fans', 'Fans', 'fan', 'comfort'], ['parking', 'Parking', 'car', 'comfort']
  ];
  var AM_GROUPS = [['fun', 'Fun & entertainment'], ['space', 'Indoor spaces'], ['nature', 'Garden & nature'], ['kitchen', 'Kitchen & dining supplies'], ['comfort', 'Comfort & access']];
  var AM_LABEL = {}; AMENITIES.forEach(function (a) { AM_LABEL[a[0]] = a; });

  var KITCHEN_ROWS = [
    ['selfCooking', 'Self-cooking allowed'], ['fridge', 'Refrigerator'], ['stove', 'Stove / cooktop'], ['potsPans', 'Pots, pans & woks'],
    ['knivesBoard', 'Knives & chopping board'], ['tableware', 'Plates, cups & cutlery'], ['kettle', 'Kettle'], ['water', 'Drinking water / dispenser'],
    ['dishSoap', 'Dish-washing liquid'], ['bbqAllowed', 'BBQ allowed'], ['ownSupplies', 'Charcoal, food & seasoning'], ['limits', 'Usage limits & rules']
  ];
  var BATH_ROWS = [
    ['total', 'Bathrooms'], ['toilets', 'Toilets'], ['showers', 'Showers'], ['privacy', 'Private or shared'], ['hotWater', 'Hot water'],
    ['toiletries', 'Shampoo & body wash'], ['towels', 'Towels'], ['extraToilets', 'Extra common toilets'], ['location', 'Indoor / outdoor']
  ];
  var PRICE_ROWS = [
    ['nightly', 'Nightly price'], ['cleaning', 'Cleaning fee'], ['service', 'Service fee'], ['taxes', 'Taxes & local fees'], ['deposit', 'Deposit'],
    ['extraGuests', 'Extra-guest charge'], ['extraMattress', 'Extra mattress'], ['activities', 'BBQ & other charges'], ['meals', 'Meals included'],
    ['multiUnit', 'Several units needed?'], ['minStay', 'Minimum stay']
  ];
  var BED_LABEL = { king: 'King bed', queen: 'Queen bed', double: 'Double bed', single: 'Single bed', bunk: 'Bunk bed', sofa_bed: 'Sofa bed', floor_mattress: 'Floor mattress', couch: 'Couch (not a bed)' };

  /* ---------- derived numbers ---------- */
  function bedStats(p) {
    var t = {};
    (p.bedrooms || []).forEach(function (r) { r.beds.forEach(function (b) { t[b.type] = (t[b.type] || 0) + b.qty; }); });
    var n = function (k) { return t[k] || 0; };
    var units = n('king') + n('queen') + n('double') + n('single') + n('bunk') + n('sofa_bed');
    return {
      t: t, units: units, airbnbCount: units + n('bunk'),
      spots: 2 * (n('king') + n('queen') + n('double')) + n('single') + 2 * n('bunk') + n('sofa_bed'),
      floor: n('floor_mattress'), couch: n('couch')
    };
  }
  function bedChips(t) {
    var order = ['king', 'queen', 'double', 'single', 'bunk', 'sofa_bed', 'floor_mattress', 'couch'];
    return order.filter(function (k) { return t[k]; }).map(function (k) {
      return '<span class="bchip">' + icon('bed', 16) + '<b>' + t[k] + '</b> ' + BED_LABEL[k] + '</span>';
    }).join('');
  }
  function km(a, b) {
    var R = 6371, rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function kmFromKL(p) { return Math.round(km(META.kl, p.location)); }
  function zone(p) { return META.zones[p.zone] || { label: '', color: '#f2b663' }; }
  function amStatus(p, key) { return rec(p.amenities, key).status; }
  function kitchenTally(p) {
    var c = 0, nd = 0;
    KITCHEN_ROWS.forEach(function (r) { var s = rec(p.kitchen, r[0]).status; if (s === 'confirmed' || s === 'additional_charge') c++; if (s === 'not_disclosed') nd++; });
    return { confirmed: c, notDisclosed: nd, total: KITCHEN_ROWS.length };
  }
  function totalFor(id) {
    var v = parseFloat(state.totals[id]); if (v > 0) return v;
    var t = BY_ID[id].pricing && BY_ID[id].pricing.total; return t > 0 ? t : null;
  }
  function totalVal(id) { return state.totals[id] || (BY_ID[id].pricing && BY_ID[id].pricing.total) || ''; }
  function hcVal() { return state.headcount || META.participants || ''; }
  function headcount() {
    var n = parseInt(state.headcount, 10); if (!(n > 0)) n = parseInt(META.participants, 10);
    return n > 0 ? n : 0;
  }
  function perPerson(id) { var total = totalFor(id), n = headcount(); return total && n ? total / n : null; }
  function priceLine(p) {
    var t = totalFor(p.id);
    if (t) return 'Quoted ' + fmtRM(t) + ' total' + ((p.pricing && p.pricing.totalNote) ? ' (' + p.pricing.totalNote + ')' : '');
    return p.card.price || 'Not yet confirmed';
  }
  function pinInfo(p) {
    var t = totalFor(p.id);
    if (t) return { text: fmtRM(t), known: true };
    if (p.pricing && p.pricing.pin) return { text: p.pricing.pin, known: true };
    return { text: 'Price ?', known: false };
  }

  /* ---------- photos with a three-step fallback: local folder -> official URL -> placeholder ---------- */
  function baseName(u) {
    var s = String(u).split('?')[0].split('/').pop();
    try { s = decodeURIComponent(s); } catch (e) { /* keep raw */ }
    return s.replace(/[^A-Za-z0-9._-]/g, '_');
  }
  function photoSrcs(p, i, size) {
    var ph = p.photos[i]; if (!ph) return [];
    if (ph.src) return [ph.src];
    var out = ['assets/images/' + p.id + '/' + baseName(ph.remote)];
    if (/muscache\.com/.test(ph.remote)) {
      var big = ph.remote + '?im_w=1200', small = ph.remote + '?im_w=720';
      out = out.concat(size === 'large' ? [big, small] : [small, big]);
    } else { out.push(ph.remote); }
    return out;
  }
  function img(p, i, size, cls) {
    if (HOSTED) return '<div class="ph-missing"><span>Photo not shown here</span><small>Open the original listing</small></div>';
    var s = photoSrcs(p, i, size); var ph = p.photos[i];
    if (!s.length) return '<div class="ph-missing"><span>No photo yet</span><small>Add one in data/properties.js</small></div>';
    return '<img class="' + (cls || '') + '" src="' + esc(s[0]) + '" data-fb="' + esc(s.slice(1).join('|')) + '" alt="' + esc(p.name + ' — ' + ph.caption) + '" loading="' + (size === 'large' ? 'eager' : 'lazy') + '" decoding="async">';
  }
  document.addEventListener('error', function (e) {
    var t = e.target; if (!t || t.tagName !== 'IMG') return;
    var fb = (t.getAttribute('data-fb') || '').split('|').filter(Boolean);
    if (fb.length) { t.setAttribute('data-fb', fb.slice(1).join('|')); t.src = fb[0]; return; }
    var d = document.createElement('div');
    d.className = 'ph-missing ' + (t.className || '');
    d.setAttribute('role', 'img'); d.setAttribute('aria-label', t.alt || 'Photo unavailable');
    d.innerHTML = '<span>Photo unavailable</span><small>Open the original listing for this photo</small>';
    t.replaceWith(d);
  }, true);

  /* ---------- routing ---------- */
  var STEPS = [
    { label: 'Intro', hash: '#/intro' }, { label: 'Map', hash: '#/map' }
  ].concat(P.map(function (p) { return { label: p.label, hash: '#/p/' + p.id }; }))
    .concat([{ label: 'Compare', hash: '#/compare' }, { label: 'Discuss', hash: '#/discuss' }]);
  var current = { view: 'home', step: 0 };

  function parseRoute() {
    var h = (location.hash || '').replace(/^#\/?/, '') || 'intro';
    var parts = h.split('/');
    if (parts[0] === 'p' && BY_ID[parts[1]]) return { view: 'detail', step: 2 + BY_ID[parts[1]]._i, id: parts[1] };
    if (parts[0] === 'compare') return { view: 'compare', step: 2 + P.length };
    if (parts[0] === 'discuss') return { view: 'discuss', step: 3 + P.length };
    if (parts[0] === 'map' || parts[0] === 'cards') return { view: 'home', step: 1 };
    return { view: 'home', step: 0 };
  }
  function go(hash) { if (location.hash === hash) { onRoute(); } else { location.hash = hash; } }

  function onRoute() {
    var r = parseRoute(); current = r;
    $$('.view').forEach(function (v) { v.hidden = v.id !== 'view-' + r.view; });
    ['detail', 'compare', 'discuss'].forEach(function (k) { if (k !== r.view) $('#view-' + k).innerHTML = ''; }); /* no stale hidden copies of inputs */
    if (r.view === 'detail') { $('#view-detail').innerHTML = renderDetail(BY_ID[r.id]); updateBuilder(); }
    if (r.view === 'compare') $('#view-compare').innerHTML = renderCompare();
    if (r.view === 'discuss') $('#view-discuss').innerHTML = renderDiscuss();
    renderSteps();
    if (r.view === 'home') {
      if (mapObj) setTimeout(function () { mapObj.invalidateSize(); }, 60);
      if (r.step === 1) { var m = $('#map'); if (m) m.scrollIntoView({ behavior: 'auto', block: 'start' }); } else { window.scrollTo(0, 0); }
    } else { window.scrollTo(0, 0); }
    document.title = (r.view === 'detail' ? BY_ID[r.id].name + ' — ' : '') + META.title;
  }

  function renderSteps() {
    var bar = $('#steps');
    bar.innerHTML = STEPS.map(function (s, i) {
      return '<a class="step' + (i === current.step ? ' on' : '') + '" href="' + s.hash + '" aria-label="View ' + (i + 1) + ': ' + esc(s.label) + '"' + (i === current.step ? ' aria-current="step"' : '') + '><span class="n">' + (i + 1) + '</span><span class="t">' + esc(s.label) + '</span></a>';
    }).join('');
    var on = $('.step.on', bar);
    if (on && (on.offsetLeft < bar.scrollLeft || on.offsetLeft + on.offsetWidth > bar.scrollLeft + bar.clientWidth)) {
      bar.scrollLeft = Math.max(0, on.offsetLeft - bar.clientWidth / 2 + on.offsetWidth / 2);
    } else if (bar.scrollWidth - bar.clientWidth < 40) { bar.scrollLeft = 0; }
    $('#prev').disabled = current.step === 0;
    $('#next').disabled = current.step === STEPS.length - 1;
  }
  function stepBy(d) { var n = current.step + d; if (n >= 0 && n < STEPS.length) go(STEPS[n].hash); }

  /* ---------- HOME: hero + map + cards ---------- */
  function renderHome() {
    var photos = P.reduce(function (n, p) { return n + p.photos.length; }, 0);
    var kv = P.filter(function (p) { return p.zone === 'klang_valley'; }).length;
    var out = P.length - kv;
    var priced = P.filter(function (p) { return p.pricing && p.pricing.status === 'confirmed'; }).length;
    $('#view-home').innerHTML =
      '<header class="hero" id="intro">' +
        '<div class="lights" aria-hidden="true">' + lightsSvg() + '</div>' +
        '<div class="hero-in">' +
          '<h1>' + esc(META.title) + '</h1>' +
          '<p class="sub">' + esc(META.subtitle) + '</p>' +
          '<p class="intro">Four places to spend the night we count down to 2027. Compare them on the map, open any one for photos, beds, bathrooms, facilities and cost, then decide together.</p>' +
          '<dl class="stats">' +
            '<div><dt>Candidate places</dt><dd>' + P.length + '</dd><small>3 whole-house Airbnbs + 1 glamping site</small></div>' +
            '<div><dt>By area</dt><dd>' + kv + ' + ' + out + '</dd><small>' + kv + ' Klang Valley suburbs, ' + out + ' highland / nature</small></div>' +
            '<div><dt>Real photos linked</dt><dd>' + photos + '</dd><small>from the listings and the official site</small></div>' +
            '<div class="warn"><dt>Prices confirmed for our dates</dt><dd>' + priced + ' of ' + P.length + '</dd><small>' + esc(META.priceDisclaimer) + '</small></div>' +
          '</dl>' +
          '<div class="hero-cta"><a class="btn primary" href="#/map">Open the map</a><a class="btn ghost" href="#/compare">Jump to comparison</a></div>' +
        '</div>' +
      '</header>' +
      '<section class="mapsec" id="map" aria-label="Interactive map of the four candidate places">' +
        '<div class="sec-head"><h2>Where the four places are</h2><p>No candidate is inside KL city itself. Distances are straight-line from the KL city centre, not driving time.</p></div>' +
        '<div class="filters" role="group" aria-label="Filter by facility">' +
          '<span class="flabel">Must have:</span>' +
          [['pool', 'Pool'], ['bbq', 'BBQ'], ['karaoke', 'Karaoke'], ['kitchen', 'Kitchen'], ['parking', 'Parking']].map(function (f) {
            return '<button type="button" class="fchip" data-filter="' + f[0] + '" aria-pressed="false">' + icon(AM_LABEL[f[0]][2], 16) + f[1] + '</button>';
          }).join('') +
          '<button type="button" class="fchip clear" data-filter="__clear" hidden>Clear</button>' +
          '<span class="fnote" id="fnote"></span>' +
          '<div class="seg" role="group" aria-label="Map style"><button type="button" class="on" data-maptab="map" aria-pressed="true">Map</button><button type="button" data-maptab="schem" aria-pressed="false">Schematic</button></div>' +
        '</div>' +
        '<div class="map-wrap">' +
          '<div id="leaflet" role="application" aria-label="Map"></div>' +
          '<div id="schem" class="schem" hidden></div>' +
          '<div class="map-banner" id="mapBanner" hidden></div>' +
        '</div>' +
        '<div class="legend">' + Object.keys(META.zones).map(function (k) { return '<span><i style="background:' + META.zones[k].color + '"></i>' + esc(META.zones[k].label) + '</span>'; }).join('') +
          '<span><i class="ring"></i>Dashed circle = approximate location (exact address not public)</span>' +
          '<span>Price tag: reference price or the quote you entered. "Price ?" = not confirmed yet</span></div>' +
      '</section>' +
      '<section class="cardsec" id="cards"><div class="sec-head"><h2>Candidate places</h2><p>Click a card to fly the map to it. Open the details for the full breakdown.</p></div>' +
        '<div class="cards">' + P.map(cardHtml).join('') + '</div></section>';
  }

  function lightsSvg() {
    var bulbs = '', n = 18;
    for (var i = 0; i < n; i++) {
      var x = 20 + i * (960 / (n - 1)), y = 26 + Math.sin(i * 0.9) * 8 + (i % 2 ? 6 : 0);
      bulbs += '<circle class="bulb" style="animation-delay:' + (i * 70) + 'ms" cx="' + x.toFixed(0) + '" cy="' + (y + 16).toFixed(0) + '" r="5.5"/>';
    }
    return '<svg viewBox="0 0 1000 70" preserveAspectRatio="none"><path d="M0 18 Q 100 44 200 22 T 400 24 T 600 24 T 800 22 T 1000 18" fill="none" stroke="rgba(244,236,220,.28)" stroke-width="1.2"/>' + bulbs + '</svg>';
  }

  function cardHtml(p) {
    var z = zone(p);
    return '<article class="card" data-id="' + p.id + '" style="--c:' + z.color + '">' +
      '<button type="button" class="card-hit" data-select="' + p.id + '" aria-label="Show ' + esc(p.name) + ' on the map"></button>' +
      '<div class="card-img">' + img(p, 0, 'thumb') + '<span class="badge">' + p._badge + '</span></div>' +
      '<div class="card-body">' +
        '<p class="card-zone">' + esc(z.label) + '</p>' +
        '<h3>' + esc(p.name) + '</h3>' +
        '<p class="card-region">' + icon('pin', 15) + esc(p.region) + '</p>' +
        '<ul class="facts">' +
          '<li>' + icon('users', 16) + '<span><b>Guests</b> ' + esc(p.card.guests) + '</span></li>' +
          '<li>' + icon('bed', 16) + '<span><b>Beds</b> ' + esc(p.card.beds) + '</span></li>' +
          '<li>' + icon('bath', 16) + '<span><b>Baths</b> ' + esc(p.card.baths) + '</span></li>' +
          '<li class="price">' + icon('tag', 16) + '<span><b>Price</b> ' + esc(priceLine(p)) + '</span></li>' +
        '</ul>' +
        '<div class="minipills">' + ['pool', 'bbq', 'karaoke'].map(function (k) {
          var s = amStatus(p, k), m = STATUS[s];
          return '<span class="mp ' + m.cls + '" title="' + esc(AM_LABEL[k][1] + ': ' + m.label) + '">' + icon(AM_LABEL[k][2], 14) + AM_LABEL[k][1].replace('Swimming ', '').replace(' facilities', '') + ' <i>' + m.glyph + '</i></span>';
        }).join('') + '</div>' +
        (p.location.precision === 'approximate' ? '<p class="approx">Approximate location</p>' : '') +
        '<button type="button" class="btn primary sm" data-go="' + p.id + '">View details</button>' +
      '</div></article>';
  }

  /* ---------- MAP ---------- */
  var mapObj = null, markers = {}, circles = {}, tilesOk = 0, tilesBad = 0;

  function popupHtml(p) {
    return '<div class="pop"><div class="pop-img">' + img(p, 0, 'thumb') + '</div><div class="pop-body">' +
      '<h4>' + esc(p.name) + '</h4>' +
      '<p class="pop-sub">' + esc(p.region) + (p.location.precision === 'approximate' ? ' · <em>Approximate location</em>' : '') + '</p>' +
      '<ul><li><b>Price</b> ' + esc(priceLine(p)) + '</li>' +
      '<li><b>Type</b> ' + esc(p.type.split(' — ')[0]) + '</li>' +
      '<li><b>Max guests</b> ' + esc(p.card.guests) + '</li>' +
      '<li><b>Beds</b> ' + esc(p.card.beds) + '</li>' +
      '<li><b>Bathrooms</b> ' + esc(p.card.baths) + '</li></ul>' +
      '<button type="button" class="btn primary sm" data-go="' + p.id + '">View details</button>' +
      (p.location.gmaps ? ' <a class="btn ghost sm" href="' + esc(p.location.gmaps) + '" target="_blank" rel="noopener noreferrer">Google Maps</a>' : '') +
      '</div></div>';
  }

  function markerIcon(p) {
    var c = zone(p).color, pi = pinInfo(p);
    return L.divIcon({
      className: 'mk', iconSize: [0, 0], iconAnchor: [0, 0], popupAnchor: [0, -26],
      html: '<span class="mk-price' + (pi.known ? '' : ' unk') + '" style="--c:' + c + '"><i>' + p._badge + '</i><b>' + esc(pi.text) + '</b></span>'
    });
  }
  function refreshPins() {
    if (!mapObj) return;
    P.forEach(function (p) { if (markers[p.id] && markers[p.id].setIcon) markers[p.id].setIcon(markerIcon(p)); });
    if (state.selected) markSelected(state.selected);
    if ($('#schem') && !$('#schem').hidden) renderSchematic();
  }

  function initMap() {
    if (!window.L) { showBanner('The map library could not load (are you offline?). The schematic map and the cards below still work.'); setMapTab('schem'); return; }
    mapObj = L.map('leaflet', { zoomControl: true, scrollWheelZoom: false });
    var attrOsm = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
    var carto = attrOsm + ' &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>';
    var light = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19, attribution: carto });
    var dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19, attribution: carto });
    var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: attrOsm });
    [light, dark, osm].forEach(function (l) { l.on('tileload', function () { tilesOk++; }); l.on('tileerror', function () { tilesBad++; }); });
    light.addTo(mapObj);
    L.control.layers({ 'Map (Google-style)': light, 'Night map': dark, 'OpenStreetMap': osm }, null, { collapsed: true }).addTo(mapObj);
    mapObj.on('focus', function () { mapObj.scrollWheelZoom.enable(); });
    mapObj.on('blur', function () { mapObj.scrollWheelZoom.disable(); });

    var pts = [];
    P.forEach(function (p) {
      var ll = [p.location.lat, p.location.lng]; pts.push(ll);
      var c = zone(p).color;
      circles[p.id] = L.circle(ll, { radius: p.location.radiusKm * 1000, color: c, weight: 1.2, dashArray: '4 6', fillColor: c, fillOpacity: 0.07, interactive: false }).addTo(mapObj);
      markers[p.id] = L.marker(ll, { icon: markerIcon(p), title: p.name + ' (' + p.region + ')', keyboard: true, riseOnHover: true }).addTo(mapObj);
      markers[p.id].bindPopup(popupHtml(p), { maxWidth: 320, minWidth: 250, autoPanPadding: [30, 30] });
      markers[p.id].on('click', function () { selectProperty(p.id, 'marker'); });
    });
    L.circleMarker([META.kl.lat, META.kl.lng], { radius: 6, color: '#f4ecdc', weight: 1.5, fillColor: '#0c1022', fillOpacity: 1 }).addTo(mapObj)
      .bindTooltip('KL city centre (reference)', { permanent: false, direction: 'right' });
    pts.push([META.kl.lat, META.kl.lng]);
    mapObj.fitBounds(L.latLngBounds(pts).pad(0.35));
    mapObj.on('popupopen', function (e) {
      var el = e.popup.getElement(); if (!el) return;
      $$('[data-go]', el).forEach(function (b) { b.addEventListener('click', function () { go('#/p/' + b.getAttribute('data-go')); }); });
    });
    mapObj.on('moveend', function () { /* keep size correct after layout changes */ });

    setTimeout(function () {
      if (tilesOk === 0 && tilesBad > 0) {
        showBanner('Map tiles did not load (offline or blocked). Showing the schematic map instead. The cards below work normally.');
        setMapTab('schem');
      }
    }, 6000);
  }
  function showBanner(msg) { var b = $('#mapBanner'); if (!b) return; b.textContent = msg; b.hidden = false; }

  function setMapTab(which) {
    var map = $('#leaflet'), sc = $('#schem'); if (!map || !sc) return;
    var useSchem = which === 'schem' || !window.L;
    map.hidden = useSchem; sc.hidden = !useSchem;
    if (useSchem) renderSchematic();
    $$('[data-maptab]').forEach(function (b) {
      var on = (b.getAttribute('data-maptab') === 'schem') === useSchem;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    });
    if (!useSchem && mapObj) setTimeout(function () { mapObj.invalidateSize(); }, 50);
  }

  /* schematic fallback: relative positions only, not to scale */
  function renderSchematic() {
    var W = 760, H = 540, pad = 70;
    var lngMin = 101.60, lngMax = 101.84, latMin = 2.88, latMax = 3.52;
    var x = function (lng) { return pad + (lng - lngMin) / (lngMax - lngMin) * (W - 2 * pad); };
    var y = function (lat) { return H - pad - (lat - latMin) / (latMax - latMin) * (H - 2 * pad); };
    var kl = { x: x(META.kl.lng), y: y(META.kl.lat) };
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Schematic map: relative positions, not to scale">' +
      '<rect x="1" y="1" width="' + (W - 2) + '" height="' + (H - 2) + '" rx="14" class="sc-bg"/>' +
      '<text x="' + (W - 28) + '" y="34" class="sc-n" text-anchor="middle">N</text><path d="M' + (W - 28) + ' 42v22" class="sc-ar"/>' +
      '<text x="24" y="' + (H - 18) + '" class="sc-note">Schematic — relative positions only, not to scale. Distances are straight-line from KL city centre.</text>';
    P.forEach(function (p) {
      var px = x(p.location.lng), py = y(p.location.lat), c = zone(p).color;
      var mx = (px + kl.x) / 2, my = (py + kl.y) / 2;
      svg += '<line x1="' + kl.x + '" y1="' + kl.y + '" x2="' + px + '" y2="' + py + '" class="sc-line"/>' +
        '<text x="' + mx + '" y="' + (my - 6) + '" class="sc-km" text-anchor="middle">≈ ' + kmFromKL(p) + ' km</text>';
    });
    svg += '<circle cx="' + kl.x + '" cy="' + kl.y + '" r="9" class="sc-kl"/><text x="' + (kl.x + 16) + '" y="' + (kl.y + 5) + '" class="sc-lab">KL city centre</text>';
    P.forEach(function (p) {
      var px = x(p.location.lng), py = y(p.location.lat), c = zone(p).color;
      svg += '<g class="sc-pt" data-select="' + p.id + '" data-id="' + p.id + '" tabindex="0" role="button" aria-label="' + esc(p.name + ', ' + p.region) + '">' +
        '<circle cx="' + px + '" cy="' + py + '" r="' + (p.location.precision === 'approximate' ? 26 : 18) + '" fill="' + c + '" fill-opacity=".12" stroke="' + c + '" stroke-dasharray="4 5"/>' +
        '<circle cx="' + px + '" cy="' + py + '" r="15" fill="' + c + '"/><text x="' + px + '" y="' + (py + 5) + '" text-anchor="middle" class="sc-ltr">' + p._badge + '</text>' +
        '<text x="' + px + '" y="' + (py + 44) + '" text-anchor="middle" class="sc-lab">' + esc(p.name.split(' (')[0].split(' — ')[0]) + '</text>' +
        '<text x="' + px + '" y="' + (py + 61) + '" text-anchor="middle" class="sc-sub">' + esc(p.region) + '</text>' +
        '<text x="' + px + '" y="' + (py + 80) + '" text-anchor="middle" class="sc-price">' + esc(pinInfo(p).text) + '</text></g>';
    });
    svg += '</svg>';
    $('#schem').innerHTML = svg;
    applyFilters();
    if (state.selected) markSelected(state.selected);
  }

  /* ---------- selection + filters ---------- */
  function markSelected(id) {
    $$('.card').forEach(function (c) { c.classList.toggle('sel', c.getAttribute('data-id') === id); });
    $$('.sc-pt').forEach(function (g) { g.classList.toggle('sel', g.getAttribute('data-id') === id); });
    P.forEach(function (p) {
      var m = markers[p.id], el = m && m.getElement && m.getElement(), pin = el && el.querySelector('.mk-price');
      if (pin) pin.classList.toggle('sel', p.id === id);
      if (m && m.setZIndexOffset) m.setZIndexOffset(p.id === id ? 1000 : 0);
    });
  }
  function selectProperty(id, source) {
    state.selected = id; markSelected(id);
    var p = BY_ID[id];
    if (source !== 'marker' && mapObj && markers[id]) {
      mapObj.flyTo([p.location.lat, p.location.lng], 11, { duration: 0.9 });
      setTimeout(function () { markers[id].openPopup(); }, 950);
    }
    if (source === 'card') { var m = $('#map'); if (m && m.getBoundingClientRect().top < -40) m.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    if (source === 'marker' || source === 'schem') { var c = $('.card[data-id="' + id + '"]'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  }
  function matches(p) {
    return (state.filters || []).every(function (k) { var s = amStatus(p, k); return s === 'confirmed' || s === 'additional_charge'; });
  }
  function applyFilters() {
    var f = state.filters || [];
    $$('.fchip[data-filter]').forEach(function (b) {
      var k = b.getAttribute('data-filter');
      if (k === '__clear') { b.hidden = !f.length; return; }
      var on = f.indexOf(k) > -1; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    });
    var n = P.filter(matches).length;
    var note = $('#fnote'); if (note) note.textContent = f.length ? n + ' of ' + P.length + ' have all of these confirmed (or available for a fee)' : '';
    P.forEach(function (p) {
      var ok = matches(p);
      var c = $('.card[data-id="' + p.id + '"]'); if (c) c.classList.toggle('dim', !ok);
      var g = $('.sc-pt[data-id="' + p.id + '"]'); if (g) g.classList.toggle('dim', !ok);
      if (markers[p.id]) markers[p.id].setOpacity(ok ? 1 : 0.3);
      if (circles[p.id]) circles[p.id].setStyle({ opacity: ok ? 1 : 0.3, fillOpacity: ok ? 0.07 : 0.02 });
    });
  }

  /* ---------- DETAIL ---------- */
  function row(label, rc, extra) {
    return '<div class="row"><div class="rl">' + esc(label) + '</div><div class="rv">' + pill(rc.status, rc.qualifier) +
      (rc.value ? '<span class="val">' + esc(rc.value) + '</span>' : '') + (rc.note ? '<span class="rn">' + esc(rc.note) + '</span>' : '') + (extra || '') + '</div></div>';
  }
  function sec(id, title, ic, inner, lead) {
    return '<section class="dsec" id="sec-' + id + '"><h3>' + icon(ic, 22) + '<span>' + esc(title) + '</span></h3>' + (lead ? '<p class="lead">' + lead + '</p>' : '') + inner + '</section>';
  }

  function renderDetail(p) {
    var z = zone(p);
    var nav = [['gallery', 'Photos'], ['beds', 'Beds'], ['baths', 'Bathrooms'], ['facilities', 'Facilities'], ['kitchen', 'Kitchen'], ['fun', 'Activities'], ['price', 'Price'], ['pros', 'Pros & cautions'], ['links', 'Links']];
    var prev = P[(p._i + P.length - 1) % P.length], next = P[(p._i + 1) % P.length];
    return '<article class="detail" style="--c:' + z.color + '">' +
      '<div class="d-hero"><div class="d-hero-img">' + img(p, 0, 'large') + '</div><div class="d-shade"></div>' +
        '<button type="button" class="btn ghost sm back" data-nav="#/map">← Back to map</button><div class="d-text">' +
        '<p class="d-zone"><span class="dot"></span>' + esc(z.label) + '</p>' +
        '<h2>' + esc(p.name) + '</h2>' +
        '<p class="d-region">' + icon('pin', 18) + esc(p.region) + (p.location.precision === 'approximate' ? ' <span class="chip warn">Approximate location</span>' : '') + '</p></div></div>' +
      '<nav class="subnav" aria-label="Sections">' + nav.map(function (n) { return '<button type="button" data-scroll="sec-' + n[0] + '">' + n[1] + '</button>'; }).join('') + '</nav>' +
      keyFacts(p) +
      secGallery(p) + secBeds(p) + secBaths(p) + secFacilities(p) + secKitchen(p) + secFun(p) + secPrice(p) + secProsCons(p) + secLinks(p) +
      '<div class="d-foot"><a class="btn ghost" href="#/p/' + prev.id + '">← ' + esc(prev.label) + '</a><a class="btn primary" href="#/compare">Compare all four</a><a class="btn ghost" href="#/p/' + next.id + '">' + esc(next.label) + ' →</a></div>' +
    '</article>';
  }

  function keyFacts(p) {
    var h = p.headline || {};
    var dist = kmFromKL(p);
    return '<div class="keyfacts">' +
      '<div class="kf wide"><span class="k">' + icon('users', 18) + 'Max guests</span><b>' + esc(p.maxGuests.display) + '</b>' + pill(p.maxGuests.status) + '<small>' + esc(p.maxGuests.note) + '</small></div>' +
      '<div class="kf"><span class="k">' + icon('door', 18) + (p.units ? 'Units' : 'Bedrooms') + '</span><b>' + (p.units ? (h.units || '') : (h.bedrooms != null ? h.bedrooms : '—')) + '</b><small>' + (p.units ? '2 villas · 8 premium tents · 8 tents' : 'Airbnb headline') + '</small></div>' +
      '<div class="kf"><span class="k">' + icon('bath', 18) + 'Bathrooms</span><b>' + (h.baths != null ? h.baths : 'Per unit') + '</b><small>' + esc(p.card.baths) + '</small></div>' +
      '<div class="kf"><span class="k">' + icon('car', 18) + 'From KL centre</span><b>≈ ' + dist + ' km</b><small>straight-line, not driving</small></div>' +
      '<div class="kf"><span class="k">' + icon('tent', 18) + 'Type</span><b class="sm">' + esc(p.type.split(' — ')[0]) + '</b><small>' + esc(p.type.split(' — ').slice(1).join(' — ')) + '</small></div>' +
      '<div class="kf"><span class="k">' + icon('tag', 18) + 'Price</span><b class="sm">' + esc(priceLine(p)) + '</b><small>Final price for the countdown dates must be verified</small></div>' +
      (p.rating ? '<div class="kf"><span class="k">' + icon('check', 18) + 'Airbnb rating</span><b>' + p.rating.score + ' ★</b><small>' + p.rating.reviews + ' reviews · ' + esc(p.rating.note) + '</small></div>' : '') +
    '</div>' +
    '<p class="surround">' + esc(p.surroundings) + '</p>' +
    '<p class="locnote">' + icon('pin', 16) + (p.location.precision === 'approximate' ? '<b>Approximate location.</b> ' : '') + esc(p.address) + '. ' + esc(p.location.basis) + '</p>' +
    (p.location.gmaps ? '<p class="gm-row"><a class="btn ghost sm" href="' + esc(p.location.gmaps) + '" target="_blank" rel="noopener noreferrer">' + icon('pin', 16) + esc(p.location.gmapsLabel || 'Open in Google Maps') + '</a></p>' : '');
  }

  function secGallery(p) {
    if (HOSTED) {
      var pl = p.id === 'dusun_bonda' ? [p.links[1], p.links[2]] : [p.links[0]];
      return sec('gallery', 'Photos', 'camera',
        '<div class="banner warn">' + icon('alert', 20) + '<div><b>Photos are not shown in this hosted version</b><span>The host blocks images from other websites. ' + p.photos.length + ' real photos are on the ' + (p.id === 'dusun_bonda' ? 'official Dusun Bonda website' : 'Airbnb listing') + '. Tap below to see them. The downloadable project shows them here.</span></div></div>' +
        '<div class="links">' + pl.map(function (l) { return '<a class="btn primary" href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' + icon('camera', 16) + 'See photos: ' + esc(l.label) + '</a>'; }).join('') + '</div>');
    }
    var items = p.photos.map(function (ph, i) {
      return '<button type="button" class="g-item' + (i === 0 ? ' big' : '') + '" data-lb="' + i + '" aria-label="Open photo ' + (i + 1) + ' of ' + p.photos.length + ': ' + esc(ph.caption) + '">' + img(p, i, i === 0 ? 'large' : 'thumb') + '<span class="cap">' + esc(ph.caption) + '</span></button>';
    }).join('');
    var source = p.id === 'dusun_bonda' ? 'official Dusun Bonda website' : 'public Airbnb listing';
    return sec('gallery', 'Photo gallery', 'camera',
      '<div class="gallery">' + items + '</div>' +
      '<p class="credit">' + p.photos.length + ' photos from the ' + source + '. Click any photo to enlarge. Photos you add in data/properties.js (with a "src" path) appear here too. No photo is borrowed from another property.</p>');
  }

  function bedList(beds) {
    return '<ul class="bl">' + beds.map(function (b) { return '<li>' + icon('bed', 15) + '<b>' + b.qty + '</b> ' + esc(b.note || BED_LABEL[b.type] || b.type) + '</li>'; }).join('') + '</ul>';
  }

  function secBeds(p) {
    if (p.units) {
      var units = p.units.map(function (u) {
        return '<article class="unit"><div class="unit-img">' + img(p, u.photo, 'thumb') + '<span class="count">' + u.count + ' units</span></div><div class="unit-body">' +
          '<h4>' + esc(u.name) + '</h4><p class="muted">' + esc(u.variants) + '</p>' +
          bedList(u.beds) +
          '<div class="occ"><b>Official limit: ' + u.maxAdults + ' adults</b> + up to ' + u.maxChildren + ' child under 12 <small>(adult = 12 years and above)</small></div>' +
          '<p class="small">' + esc(u.occupancy) + '</p>' +
          '<p class="small">' + esc(u.bedNote) + '</p>' +
          '<dl class="mini"><dt>Bathroom</dt><dd>' + esc(u.bathroom) + '</dd><dt>Cooling</dt><dd>' + esc(u.climate) + '</dd></dl>' +
          '<ul class="ex">' + u.extras.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>' +
          '<p class="rate">' + fmtRM(u.rates.weekday) + ' – ' + fmtRM(u.rates.satPH) + ' <small>per unit per night, breakfast included, before SST</small></p></div></article>';
      }).join('');
      var combos = p.combos.map(function (c) {
        var a = 0, k = 0, names = [];
        p.units.forEach(function (u) { var q = c.units[u.id] || 0; if (q) { a += q * u.maxAdults; k += q * u.maxChildren; names.push(q + ' × ' + u.short); } });
        return '<div class="combo"><h5>' + esc(c.title) + '</h5><p class="names">' + esc(names.join(' + ')) + '</p><p class="cap-line">Up to <b>' + a + ' adults</b> + ' + k + ' children under 12</p><p class="small">' + esc(c.blurb) + '</p>' +
          '<button type="button" class="btn ghost sm" data-combo="' + c.id + '">Price this option</button></div>';
      }).join('');
      return sec('beds', 'Beds & sleeping arrangements', 'bed',
        '<div class="unit-grid">' + units + '</div>' +
        '<h4 class="sub-h">Ways to combine units</h4><div class="combos">' + combos + '</div>' +
        '<p class="note-box">These three options only show the structure. Real numbers depend on how many of us come, and on the official limits above. ' + p.sleepingNotes.map(esc).join(' ') + '</p>',
        'Dusun Bonda is a set of separate units, not one house. <b>Capacity is set per unit by the official rules, not by bed count.</b> You choose which units to book.');
    }
    var s = bedStats(p);
    var concept = '<div class="concept">' +
      '<div class="cbox"><span class="k">Bed count</span>' + (p.bedroomsComplete ? '<b>' + s.units + '</b><small>bed frames, not counting floor mattresses or couches. Airbnb headline: ' + p.headline.beds + ' (counts each bunk as 2)</small>' : '<b class="q">?</b><small>Need confirmation. Airbnb headline says ' + p.headline.beds + ' beds, but only some rooms are itemised</small>') + '</div>' +
      '<div class="cbox"><span class="k">Sleeping spots (estimate)</span>' + (p.bedroomsComplete ? '<b>' + s.spots + '</b><small>double / queen / king = 2, single = 1, each bunk = 2 tiers × 1, sofa bed = 1' + (s.floor ? '. Plus ' + s.floor + ' floor mattresses' : '') + '</small>' : '<b class="q">?</b><small>Cannot be estimated until bed sizes per room are known</small>') + '</div>' +
      '<div class="cbox"><span class="k">Guests allowed (stated)</span><b class="sm">' + esc(p.maxGuests.display) + '</b>' + pill(p.maxGuests.status) + '</div></div>';
    var rooms = '';
    if (p.bedrooms && p.bedrooms.length) {
      rooms = '<div class="room-grid">' + p.bedrooms.map(function (r) {
        var t = {}; r.beds.forEach(function (b) { t[b.type] = (t[b.type] || 0) + b.qty; });
        return '<article class="room">' + (r.photo != null && !HOSTED ? '<div class="room-img">' + img(p, r.photo, 'thumb') + '</div>' : '') + '<div class="room-body"><h4>' + esc(r.name) + '</h4><div class="bchips">' + bedChips(t) + '</div></div></article>';
      }).join('') + '</div>';
    }
    var types = p.roomTypes ? '<h4 class="sub-h">Room types described by the host</h4><div class="types">' + p.roomTypes.map(function (r) { return '<div class="type"><b>' + r.count + '</b><span><strong>' + esc(r.name) + '</strong>' + esc(r.desc) + '</span></div>'; }).join('') + '</div>' : '';
    return sec('beds', 'Beds & sleeping arrangements', 'bed',
      concept +
      (p.bedroomsComplete ? '<div class="bchips total">' + bedChips(s.t) + '</div>' : '') +
      '<h4 class="sub-h">Bedroom by bedroom</h4>' + rooms + types +
      '<ul class="notes">' + p.sleepingNotes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' +
      '<div class="rows">' + row('Linen, pillows & blankets', rec(p, 'bedding')) + '</div>',
      'Three different numbers matter: how many beds there are, how many people can actually sleep, and how many guests the host allows.');
  }

  function secBaths(p) {
    var rows = BATH_ROWS.map(function (r) { return row(r[1], rec(p.bathrooms, r[0])); }).join('');
    return sec('baths', 'Toilets & bathrooms', 'bath', '<div class="rows">' + rows + '</div>');
  }

  function secFacilities(p) {
    var groups = AM_GROUPS.map(function (g) {
      var tiles = AMENITIES.filter(function (a) { return a[3] === g[0]; }).map(function (a) {
        var r = rec(p.amenities, a[0]);
        return '<div class="am ' + STATUS[r.status].cls + '" data-s="' + r.status + '"><div class="am-h">' + icon(a[2], 20) + '<span>' + a[1] + '</span></div>' + pill(r.status, r.qualifier) + (r.note ? '<p>' + esc(r.note) + '</p>' : '') + '</div>';
      }).join('');
      return '<h4 class="sub-h">' + g[1] + '</h4><div class="am-grid">' + tiles + '</div>';
    }).join('');
    return sec('facilities', 'Facility checklist', 'check',
      '<div class="am-filter" role="group" aria-label="Filter facilities"><button type="button" class="fchip on" data-amfilter="all">All 27</button><button type="button" class="fchip" data-amfilter="ok">Confirmed</button><button type="button" class="fchip" data-amfilter="check">Needs checking</button></div>' + groups,
      'Every item has one of five states. Nothing is assumed: a facility that the page does not mention is shown as <b>Not disclosed</b>.');
  }

  function secKitchen(p) {
    var t = kitchenTally(p);
    var rows = KITCHEN_ROWS.map(function (r) { return row(r[1], rec(p.kitchen, r[0])); }).join('');
    return sec('kitchen', 'Kitchen & supplies', 'pot', '<p class="tally">' + t.confirmed + ' of ' + t.total + ' kitchen points confirmed' + (t.notDisclosed ? ' · ' + t.notDisclosed + ' not disclosed' : '') + '</p><div class="rows">' + rows + '</div>');
  }

  function secFun(p) {
    var keys = ['pool', 'bbq', 'karaoke', 'mahjong', 'boardgames', 'gaming', 'projector', 'playground', 'river', 'waterfall', 'outdoor', 'other'];
    var yes = keys.filter(function (k) { var s = amStatus(p, k); return s === 'confirmed' || s === 'additional_charge'; });
    var gap = ['karaoke', 'mahjong', 'boardgames', 'gaming', 'projector'].filter(function (k) { return amStatus(p, k) !== 'confirmed' && amStatus(p, k) !== 'additional_charge'; });
    return sec('fun', 'Outdoor facilities & entertainment', 'mountain',
      '<div class="fun"><div><h4 class="sub-h">What the group can do here</h4>' +
      (yes.length ? '<ul class="fun-list">' + yes.map(function (k) { var r = rec(p.amenities, k); return '<li>' + icon(AM_LABEL[k][2], 18) + '<span><b>' + AM_LABEL[k][1] + '</b> ' + pill(r.status, r.qualifier) + '<em>' + esc(r.note || '') + '</em></span></li>'; }).join('') + '</ul>' : '<p class="muted">Nothing confirmed yet.</p>') + '</div>' +
      '<div><h4 class="sub-h">Bring it or ask first</h4><ul class="fun-list gap">' + (gap.length ? gap.map(function (k) { var r = rec(p.amenities, k); return '<li>' + icon(AM_LABEL[k][2], 18) + '<span><b>' + AM_LABEL[k][1] + '</b> ' + pill(r.status) + '<em>' + esc(r.note || 'The page does not say.') + '</em></span></li>'; }).join('') : '<li class="muted">All party facilities are confirmed.</li>') + '</ul></div></div>');
  }

  function perPersonBlock(id) {
    var v = perPerson(id);
    return '<div class="pp" data-pp="' + id + '"><h4 class="sub-h">Cost per person</h4>' +
      '<p class="small">Per person = confirmed total ÷ participants. Nothing is shown until both numbers are entered.</p>' +
      '<div class="pp-in"><label>Confirmed total for the stay (RM)<input type="number" min="0" step="any" inputmode="decimal" data-total="' + id + '" value="' + esc(totalVal(id)) + '" placeholder="e.g. from a quote"></label>' +
      '<label>Participants<input type="number" min="1" step="1" inputmode="numeric" data-headcount value="' + esc(hcVal()) + '" placeholder="head count"></label></div>' +
      '<p class="pp-out" data-ppout="' + id + '">' + (v ? '<b>' + fmtRM2(v) + '</b> per person' : 'Enter a confirmed total and the number of participants.') + '</p></div>';
  }

  function secPrice(p) {
    var items = p.pricing.items || {};
    var rows = PRICE_ROWS.filter(function (r) { return r[0] !== 'meals' || items.meals; }).map(function (r) { return row(r[1], rec(items, r[0])); }).join('');
    var extra = '';
    if (p.units) {
      var T = { weekday: 'Mon – Thu', friSun: 'Fri, Sun & school holidays', satPH: 'Sat, public holidays & eve of public holidays' };
      extra = '<h4 class="sub-h">Reference rates (per unit per night, breakfast included, before SST)</h4>' +
        '<div class="rate-table" role="table"><div class="rt-h" role="row"><span role="columnheader">Unit</span>' + Object.keys(T).map(function (k) { return '<span role="columnheader">' + T[k] + '</span>'; }).join('') + '</div>' +
        p.units.map(function (u) { return '<div class="rt-r" role="row"><span role="cell"><b>' + esc(u.short) + '</b><small>' + u.maxAdults + ' adults</small></span>' + Object.keys(T).map(function (k) { return '<span role="cell">' + fmtRM(u.rates[k]) + '</span>'; }).join('') + '</div>'; }).join('') + '</div>' +
        '<p class="note-box">31 Dec 2026 is a Thursday and the eve of 1 Jan, a public holiday. If your night is 31 Dec, the right-hand (highest) tier is the one that should apply. Confirm with the website or a quote. Dec 2026 availability is bookable online at the time of research, but it must be checked.</p>' +
        builderHtml(p);
    }
    return sec('price', 'Price & extra charges', 'tag',
      '<div class="banner warn">' + icon('alert', 20) + '<div><b>' + esc(META.priceDisclaimer) + '</b><span>' + esc(p.pricing.note) + '</span></div></div>' +
      '<p class="headline-price">' + esc(p.pricing.headline) + ' ' + pill(p.pricing.status) + '</p>' +
      '<div class="rows">' + rows + '</div>' + extra + perPersonBlock(p.id));
  }

  function builderHtml(p) {
    var b = state.builder;
    var ctl = p.units.map(function (u) {
      return '<div class="bld-row"><span><b>' + esc(u.short) + '</b><small>' + u.maxAdults + ' adults each · ' + u.count + ' exist</small></span>' +
        '<span class="stepper"><button type="button" data-bld="' + u.id + '" data-d="-1" aria-label="Fewer ' + esc(u.short) + '">−</button><output id="bld-' + u.id + '">' + (b[u.id] || 0) + '</output><button type="button" data-bld="' + u.id + '" data-d="1" aria-label="More ' + esc(u.short) + '">+</button></span></div>';
    }).join('');
    return '<div class="builder" id="builder"><h4 class="sub-h">Reference cost builder</h4>' +
      '<p class="small">Pick units and the rate tier. This uses the published reference rates, so it is <b>not a quote</b>. SST is not included.</p>' +
      '<label class="tier">Rate tier<select data-tier><option value="weekday"' + (state.tier === 'weekday' ? ' selected' : '') + '>Mon – Thu</option><option value="friSun"' + (state.tier === 'friSun' ? ' selected' : '') + '>Fri, Sun & school holidays</option><option value="satPH"' + (state.tier === 'satPH' ? ' selected' : '') + '>Sat, public holidays & eve of public holidays</option></select></label>' +
      ctl + '<div class="bld-out" id="bldOut"></div></div>';
  }
  function updateBuilder() {
    var p = BY_ID.dusun_bonda, out = $('#bldOut'); if (!out) return;
    var sum = 0, fee = 0, adults = 0, n = 0;
    p.units.forEach(function (u) { var q = state.builder[u.id] || 0; n += q; sum += q * u.rates[state.tier]; fee += q * 5; adults += q * u.maxAdults; var o = $('#bld-' + u.id); if (o) o.textContent = q; });
    var hc = headcount();
    var cap = n ? 'Adult capacity: <b>' + adults + '</b>' + (hc ? (hc <= adults ? ' — enough for ' + hc + ' people if all are adults' : ' — <span class="bad">not enough for ' + hc + ' people</span>') : '') : '';
    out.innerHTML = n ? '<div><span>Units × rate (1 night)</span><b>' + fmtRM(sum) + '</b></div><div><span>Sustainability fee (RM5 per unit)</span><b>' + fmtRM(fee) + '</b></div><div class="tot"><span>Reference subtotal before SST</span><b>' + fmtRM(sum + fee) + '</b></div><p class="small">' + cap + '</p>' +
      '<button type="button" class="btn ghost sm" data-usetotal="' + (sum + fee) + '">Use this as the Dusun Bonda total (comparison and per-person)</button>' : '<p class="small">Add at least one unit.</p>';
  }

  function secProsCons(p) {
    var rules = p.rules ? '<h4 class="sub-h">Official rules that affect a countdown night</h4><div class="rules">' + p.rules.map(function (r) { return '<div class="rule ' + r.tone + '">' + icon(r.tone === 'warn' ? 'alert' : 'check', 18) + '<div><b>' + esc(r.title) + '</b><span>' + esc(r.body) + '</span></div></div>'; }).join('') + '</div>' : '';
    return sec('pros', 'Strengths & things to watch', 'alert',
      '<div class="pc"><div class="pros"><h4>Strengths</h4><ul>' + p.pros.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="cons"><h4>Watch out for</h4><ul>' + p.cautions.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></div>' + rules +
      '<h4 class="sub-h">Still to confirm</h4><ul class="open">' + p.openItems.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
  }

  function secLinks(p) {
    return sec('links', p.id === 'dusun_bonda' ? 'Official links' : 'Original listing', 'link',
      '<div class="links">' + p.links.map(function (l) { return '<a class="btn primary" href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' + icon('link', 16) + esc(l.label) + '</a>'; }).join('') + '</div>' +
      '<p class="small muted">Opens in a new tab. Some Airbnb details (full amenity list, prices) only appear on the live listing.</p>');
  }

  /* ---------- COMPARE ---------- */
  function renderCompare() {
    function cells(fn) { return '<div class="cgrid">' + P.map(function (p) { return '<div class="cell" style="--c:' + zone(p).color + '"><span class="who"><i>' + p._badge + '</i>' + esc(p.label) + '</span>' + fn(p) + '</div>'; }).join('') + '</div>'; }
    function crit(ic, title, fn) { return '<section class="crit"><h3>' + icon(ic, 20) + esc(title) + '</h3>' + cells(fn) + '</section>'; }
    var party = ['pool', 'bbq', 'karaoke', 'mahjong', 'boardgames', 'gaming', 'projector'];
    return '<div class="cmp"><div class="sec-head"><h2>Side-by-side comparison</h2><p>Same facts, same layout. No ranking: where something is unknown it says so.</p></div>' +
      '<div class="pp-global"><label>Participants (used for per-person cost)<input type="number" min="1" step="1" inputmode="numeric" data-headcount value="' + esc(hcVal()) + '" placeholder="how many of us?"></label></div>' +
      crit('pin', 'Property & area', function (p) { return '<b>' + esc(p.name) + '</b><span>' + esc(p.region) + '</span><span class="muted">' + esc(p.type.split(' — ')[0]) + '</span>'; }) +
      crit('users', 'Capacity & limits', function (p) { return '<b>' + esc(p.card.guests) + '</b>' + pill(p.maxGuests.status) + '<small>' + esc(p.maxGuests.note) + '</small>'; }) +
      crit('bed', 'Beds', function (p) { var s = bedStats(p); return '<b>' + esc(p.card.beds) + '</b>' + (p.bedroomsComplete ? '<small>Sleeping spots (estimate): ' + s.spots + (s.floor ? ' + ' + s.floor + ' on floor mattresses' : '') + '</small>' : '<small>Capacity follows official per-unit limits, or needs confirmation</small>'); }) +
      crit('door', 'Bedrooms', function (p) { return '<b>' + (p.units ? '18 units' : p.headline.bedrooms + ' bedrooms') + '</b><small>' + (p.units ? 'Each unit is one sleeping space' : p.roomTypes ? '9 twin · 4 triple · 2 quad (host)' : 'Per-room layout in the details page') + '</small>'; }) +
      crit('bath', 'Toilets & bathrooms', function (p) { return '<b>' + esc(p.card.baths) + '</b><small>' + esc(rec(p.bathrooms, 'toilets').note || rec(p.bathrooms, 'privacy').note || 'Private / shared not disclosed') + '</small>'; }) +
      crit('pool', 'Facilities', function (p) { return '<div class="cchips">' + party.map(function (k) { var s = amStatus(p, k); return '<span class="cc ' + STATUS[s].cls + '" title="' + esc(AM_LABEL[k][1] + ': ' + STATUS[s].label) + '">' + icon(AM_LABEL[k][2], 14) + AM_LABEL[k][1].replace('Swimming ', '').replace(' facilities', '').replace('Projector / meeting space', 'Projector') + '<i>' + STATUS[s].glyph + '</i></span>'; }).join('') + '</div>'; }) +
      crit('pot', 'Kitchen', function (p) { var t = kitchenTally(p); return pill(rec(p.kitchen, 'selfCooking').status) + '<b>' + t.confirmed + ' of ' + t.total + ' points confirmed</b><small>' + esc(rec(p.kitchen, 'selfCooking').note || '') + '</small>'; }) +
      crit('tag', 'Price & per person', function (p) { var v = perPerson(p.id); return '<b>' + esc(p.pricing.headline) + '</b>' + pill(p.pricing.status) + '<label class="mini-in">Confirmed total (RM)<input type="number" min="0" step="any" inputmode="decimal" data-total="' + p.id + '" value="' + esc(totalVal(p.id)) + '"></label><p class="pp-out" data-ppout="' + p.id + '">' + (v ? '<b>' + fmtRM2(v) + '</b> per person' : 'Per person: not shown until total and participants are confirmed') + '</p>'; }) +
      '<p class="disclaimer">' + icon('alert', 16) + esc(META.priceDisclaimer) + '</p>' +
      crit('camera', 'Photos', function (p) { if (HOSTED) return '<b>' + p.photos.length + ' real photos</b><small>Not shown in this hosted version</small><a href="' + esc(p.links[p.id === 'dusun_bonda' ? 1 : 0].url) + '" target="_blank" rel="noopener noreferrer">Open photos</a>'; return '<div class="cthumbs">' + [0, 1, 2].map(function (i) { return p.photos[i] ? '<button type="button" class="ct" data-lbp="' + p.id + '" data-lb="' + i + '" aria-label="Open photo ' + (i + 1) + '">' + img(p, i, 'thumb') + '</button>' : ''; }).join('') + '</div><small>' + p.photos.length + ' real listing photos</small>'; }) +
      crit('car', 'Transport & location', function (p) { return '<b>' + esc(zone(p).label) + '</b><span>≈ ' + kmFromKL(p) + ' km from KL centre (straight-line)</span>' + (p.location.precision === 'approximate' ? '<span class="chip warn">Approximate location</span>' : '') + '<small>' + esc(p.surroundings.split('. ')[0]) + '.</small>'; }) +
      crit('alert', 'Rules, extra charges & open items', function (p) { return '<ul class="cl">' + p.cautions.slice(0, 3).map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul><small>' + p.openItems.length + ' open items · <a href="#/p/' + p.id + '">full details</a></small>'; }) +
      '<div class="d-foot"><a class="btn ghost" href="#/map">← Back to map</a><a class="btn primary" href="#/discuss">Go to discussion</a></div></div>';
  }

  /* ---------- DISCUSSION ---------- */
  function renderDiscuss() {
    var qs = [
      'How many are coming, and how many are children under 12?',
      'Which night exactly, and do we all arrive and leave together?',
      'Is the night a loud countdown party, or a quiet retreat? (Dusun Bonda bans loud music and karaoke; Airbnb A asks for quiet from 11 pm; Airbnb C stops loud sound at 12 am.)',
      'Is halal-only food and drink acceptable for everyone? (Required at Dusun Bonda, including BBQ.)',
      'Which facilities are must-haves: pool, BBQ, karaoke, kitchen?',
      'What is the budget ceiling per person once real totals are known?',
      'How do we get there, and who drives? (Airbnb B parks only 4 cars.)',
      'Is everyone fine with the sleeping setup: bunk beds, floor mattresses, shared rooms or tents?'
    ];
    var open = P.map(function (p) {
      return '<details class="od"' + (p._i === 0 ? ' open' : '') + '><summary><i>' + p._badge + '</i>' + esc(p.name) + '<span>' + p.openItems.length + ' items</span></summary><ul class="chk">' + p.openItems.map(function (t, i) {
        var k = p.id + ':' + i; return '<li><label><input type="checkbox" data-chk="' + k + '"' + (state.checked[k] ? ' checked' : '') + '><span>' + esc(t) + '</span></label></li>';
      }).join('') + '</ul></details>';
    }).join('');
    var tally = P.map(function (p) {
      return '<div class="tl"><span><i>' + p._badge + '</i>' + esc(p.label) + '</span><span class="stepper"><button type="button" data-vote="' + p.id + '" data-d="-1" aria-label="Remove a vote for ' + esc(p.label) + '">−</button><output id="vote-' + p.id + '">' + (state.votes[p.id] || 0) + '</output><button type="button" data-vote="' + p.id + '" data-d="1" aria-label="Add a vote for ' + esc(p.label) + '">+</button></span></div>';
    }).join('');
    return '<div class="disc"><div class="sec-head"><h2>Final discussion</h2><p>Everything still unconfirmed, and room to decide together. Nothing here picks a winner.</p></div>' +
      '<div class="dgrid"><section class="dcol"><h3>Still to confirm</h3><p class="small">Tick items off as the group gets answers.</p>' + open + '</section>' +
      '<section class="dcol"><h3>Questions for the group</h3><ol class="qs">' + qs.map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ol>' +
      '<h3>Show of hands</h3><p class="small">A simple counter for the room. It is a tally, not a verdict.</p>' + tally + '<button type="button" class="btn ghost sm" data-resetvotes>Reset counts</button>' +
      '<h3>Notes</h3><textarea id="notes" rows="5" placeholder="Type decisions and follow-ups here (kept only in this browser)">' + esc(state.notes) + '</textarea></section></div>' +
      '<div class="d-foot"><a class="btn ghost" href="#/compare">← Comparison</a><a class="btn primary" href="#/map">Back to map</a></div></div>';
  }

  /* ---------- LIGHTBOX ---------- */
  var lb = { pid: null, i: 0, open: false };
  function openLB(pid, i) { lb = { pid: pid, i: i, open: true }; renderLB(); var el = $('#lightbox'); el.hidden = false; document.body.classList.add('noscroll'); $('#lbClose').focus(); }
  function closeLB() { lb.open = false; $('#lightbox').hidden = true; document.body.classList.remove('noscroll'); }
  function renderLB() {
    var p = BY_ID[lb.pid], ph = p.photos[lb.i];
    $('#lbImg').innerHTML = img(p, lb.i, 'large');
    $('#lbCap').innerHTML = '<b>' + esc(ph.caption) + '</b> · ' + esc(p.name) + ' · ' + (lb.i + 1) + ' / ' + p.photos.length;
  }
  function lbStep(d) { var n = BY_ID[lb.pid].photos.length; lb.i = (lb.i + d + n) % n; renderLB(); }

  /* ---------- events ---------- */
  function wire() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-select],[data-go],[data-nav],[data-scroll],[data-filter],[data-maptab],[data-lb],[data-amfilter],[data-bld],[data-vote],[data-resetvotes],[data-usetotal],[data-combo]') : null;
      if (!t) return;
      if (t.hasAttribute('data-select')) { selectProperty(t.getAttribute('data-select'), t.closest('.sc-pt') ? 'schem' : 'card'); return; }
      if (t.hasAttribute('data-go')) { go('#/p/' + t.getAttribute('data-go')); return; }
      if (t.hasAttribute('data-nav')) { go(t.getAttribute('data-nav')); return; }
      if (t.hasAttribute('data-scroll')) { var s = document.getElementById(t.getAttribute('data-scroll')); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      if (t.hasAttribute('data-filter')) {
        var k = t.getAttribute('data-filter'), f = state.filters || [];
        if (k === '__clear') f = []; else f = f.indexOf(k) > -1 ? f.filter(function (x) { return x !== k; }) : f.concat(k);
        state.filters = f; save(); applyFilters(); return;
      }
      if (t.hasAttribute('data-maptab')) { setMapTab(t.getAttribute('data-maptab')); return; }
      if (t.hasAttribute('data-lb')) { openLB(t.getAttribute('data-lbp') || current.id, parseInt(t.getAttribute('data-lb'), 10)); return; }
      if (t.hasAttribute('data-amfilter')) {
        var m = t.getAttribute('data-amfilter');
        $$('[data-amfilter]').forEach(function (b) { b.classList.toggle('on', b === t); });
        $$('.am').forEach(function (a) { var s = a.getAttribute('data-s'); var show = m === 'all' || (m === 'ok' && (s === 'confirmed' || s === 'additional_charge')) || (m === 'check' && s !== 'confirmed' && s !== 'additional_charge'); a.hidden = !show; });
        return;
      }
      if (t.hasAttribute('data-bld')) { var id = t.getAttribute('data-bld'), d = parseInt(t.getAttribute('data-d'), 10); var u = BY_ID.dusun_bonda.units.filter(function (x) { return x.id === id; })[0]; state.builder[id] = Math.max(0, Math.min(u.count, (state.builder[id] || 0) + d)); save(); updateBuilder(); return; }
      if (t.hasAttribute('data-combo')) { var c = BY_ID.dusun_bonda.combos.filter(function (x) { return x.id === t.getAttribute('data-combo'); })[0]; state.builder = { studio: c.units.studio || 0, glam5: c.units.glam5 || 0, glam4: c.units.glam4 || 0 }; save(); var bl = $('#builder'); if (bl) { updateBuilder(); bl.scrollIntoView({ behavior: 'smooth', block: 'center' }); } return; }
      if (t.hasAttribute('data-vote')) { var vid = t.getAttribute('data-vote'); state.votes[vid] = Math.max(0, (state.votes[vid] || 0) + parseInt(t.getAttribute('data-d'), 10)); save(); $('#vote-' + vid).textContent = state.votes[vid]; return; }
      if (t.hasAttribute('data-resetvotes')) { state.votes = {}; save(); P.forEach(function (p) { var o = $('#vote-' + p.id); if (o) o.textContent = 0; }); return; }
      if (t.hasAttribute('data-usetotal')) { state.totals.dusun_bonda = t.getAttribute('data-usetotal'); save(); var inp = $('[data-total="dusun_bonda"]'); if (inp) { inp.value = state.totals.dusun_bonda; } refreshPP(); refreshPins(); t.textContent = 'Saved as the Dusun Bonda total'; return; }
    });
    document.addEventListener('input', function (e) {
      var t = e.target;
      if (t.matches && t.matches('[data-headcount]')) { state.headcount = t.value; save(); $$('[data-headcount]').forEach(function (o) { if (o !== t) o.value = t.value; }); refreshPP(); updateBuilder(); }
      else if (t.matches && t.matches('[data-total]')) { state.totals[t.getAttribute('data-total')] = t.value; save(); refreshPP(); refreshPins(); }
      else if (t.matches && t.matches('[data-tier]')) { state.tier = t.value; save(); updateBuilder(); }
      else if (t.matches && t.matches('[data-chk]')) { state.checked[t.getAttribute('data-chk')] = t.checked; save(); }
      else if (t.id === 'notes') { state.notes = t.value; save(); }
    });
    document.addEventListener('keydown', function (e) {
      if (lb.open) {
        if (e.key === 'Escape') closeLB(); else if (e.key === 'ArrowRight') lbStep(1); else if (e.key === 'ArrowLeft') lbStep(-1);
        return;
      }
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'ArrowRight') stepBy(1); else if (e.key === 'ArrowLeft') stepBy(-1);
      else if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('sc-pt')) selectProperty(e.target.getAttribute('data-id'), 'schem');
    });
    $('#lbClose').addEventListener('click', closeLB);
    $('#lbPrev').addEventListener('click', function () { lbStep(-1); });
    $('#lbNext').addEventListener('click', function () { lbStep(1); });
    $('#lightbox').addEventListener('click', function (e) { if (e.target.id === 'lightbox') closeLB(); });
    $('#prev').addEventListener('click', function () { stepBy(-1); });
    $('#next').addEventListener('click', function () { stepBy(1); });
    $('#presentBtn').addEventListener('click', function () {
      var on = document.body.classList.toggle('present'); this.setAttribute('aria-pressed', String(on));
      try { if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); else if (!on && document.fullscreenElement) document.exitFullscreen(); } catch (err) { /* fullscreen optional */ }
    });
    window.addEventListener('hashchange', onRoute);
  }
  function refreshPP() {
    P.forEach(function (p) {
      var v = perPerson(p.id);
      $$('[data-ppout="' + p.id + '"]').forEach(function (o) {
        o.innerHTML = v ? '<b>' + fmtRM2(v) + '</b> per person' : (current.view === 'compare' ? 'Per person: not shown until total and participants are confirmed' : 'Enter a confirmed total and the number of participants.');
      });
    });
  }

  /* ---------- boot ---------- */
  function whenLeaflet(cb) {
    if (window.L) { cb(); return; }
    var done = false, s = document.getElementById('leaflet-js');
    function fin() { if (done) return; done = true; cb(); }
    if (s) { s.addEventListener('load', fin); s.addEventListener('error', fin); }
    setTimeout(fin, 4000);
  }
  renderHome();
  wire();
  onRoute();
  updateBuilder();
  if (HOSTED) {
    var note = document.createElement('div');
    note.className = 'hosted-note'; note.setAttribute('role', 'note');
    note.textContent = 'Hosted preview: photos and the zoomable street map are not shown here. Tap the listing links to see photos. The downloadable project has both.';
    document.querySelector('.topbar').insertAdjacentElement('afterend', note);
    $('#leaflet').hidden = true;
    var segEl = $('.seg'); if (segEl) segEl.hidden = true;
    showBanner('Schematic map: relative positions only, not to scale. Tap a point to select it, or use the cards below.');
    setMapTab('schem');
    applyFilters();
  } else {
    $('#leaflet').innerHTML = '<p class="map-loading">Loading map…</p>';
    whenLeaflet(function () {
      $('#leaflet').innerHTML = '';
      initMap();
      if (window.L) { renderSchematic(); $('#schem').hidden = true; }
      applyFilters();
      if (current.view === 'home' && mapObj) setTimeout(function () { mapObj.invalidateSize(); }, 80);
    });
  }
  window.__countdown = { data: DATA, go: go, state: state };
})();
