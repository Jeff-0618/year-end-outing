/**
 * Year-End Countdown 2026 — shared votes and comments, stored in YOUR Google Sheet.
 * Works with "Sign in with Google" (recommended) or, if you leave CLIENT_ID empty, with a typed name only.
 *
 * Setup (see GOOGLE-SHEET-SETUP.md):
 *  1. Extensions > Apps Script.  Delete the old code and paste this whole file.
 *  2. Paste your Google OAuth Client ID between the quotes in CLIENT_ID below.
 *  3. Deploy > Manage deployments > pencil > Version: New version > Deploy   (the web app address stays the same).
 *
 * The script creates and updates these tabs by itself:
 *   Questions : Time | Venue | VenueId | Name | Question | Lang | Reply | Email | CommentId | Uid | Edited   <- write your answer in "Reply"
 *   Votes     : Time | VoterId | Type (like / pick) | VenueId | Venue | Name | Email | Uid
 *   Results   : Venue | VenueId | Votes | Likes | Voted by | Liked by    <- refreshed after votes (at most every 30 s); menu "Countdown > Refresh Results now"
 *
 * Everyone on the website can see the NAMES of who liked / voted and who commented. Emails and Google ids stay in this sheet only.
 */

/** Paste your Google OAuth Client ID here, e.g. '1234567890-abc123.apps.googleusercontent.com'. Empty = no Google sign-in (typed names). */
var CLIENT_ID = '697249602311-eqgen5h437mlbv1ib5a004h9ap1g2unr.apps.googleusercontent.com';
/** Gmail addresses allowed to delete ANY comment on the website, e.g. ['you@gmail.com']. Everyone else can only edit / delete their own. */
var ADMIN_EMAILS = ['ai603312@gmail.com'];
var SESSION_DAYS = 60;

var Q_HEAD = ['Time', 'Venue', 'VenueId', 'Name', 'Question', 'Lang', 'Reply', 'Email', 'CommentId', 'Uid', 'Edited'];
var V_HEAD = ['Time', 'VoterId', 'Type', 'VenueId', 'Venue', 'Name', 'Email', 'Uid'];
var R_HEAD = ['Venue', 'VenueId', 'Votes (one per person)', 'Likes', 'Voted by', 'Liked by'];
var CK_VOTES = 'v3:votes', CK_COMMENTS = 'v3:comments';

/* ---------- small helpers ---------- */
function sheet_(name, head) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(head); return sh; }
  var cache = CacheService.getScriptCache(), flag = 'head:' + name;
  if (!cache.get(flag)) {                                                    // older sheets: add the new column titles once
    var have = sh.getRange(1, 1, 1, head.length).getValues()[0];
    for (var i = 0; i < head.length; i++) if (!have[i]) sh.getRange(1, i + 1).setValue(head[i]);
    cache.put(flag, '1', 21600);
  }
  return sh;
}
function out_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function clean_(s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, max); }
function iso_(d) { return d instanceof Date ? d.toISOString() : String(d || ''); }

/* ---------- Google sign-in: verify the Google token, then hand out our own signed session ---------- */
function secret_() {
  var props = PropertiesService.getScriptProperties();
  var s = props.getProperty('SESSION_SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('SESSION_SECRET', s); }
  return s;
}
function b64_(str) { return Utilities.base64EncodeWebSafe(Utilities.newBlob(str).getBytes()); }
function unb64_(s) { return Utilities.newBlob(Utilities.base64DecodeWebSafe(s)).getDataAsString(); }
function sign_(payloadB64) { return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payloadB64, secret_())); }
/** A short anonymous id for a person. The website uses it to know "this like / comment is mine" without ever seeing an email. */
function uid_(key) { return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature('uid:' + String(key).toLowerCase(), secret_())).replace(/[=]+$/, '').slice(0, 12); }

function makeSession_(u) {
  var p = b64_(JSON.stringify({ sub: u.sub, name: u.name, email: u.email, exp: Date.now() + SESSION_DAYS * 86400000 }));
  return p + '.' + sign_(p);
}
function readSession_(token) {
  if (!token) return null;
  var parts = String(token).split('.');
  if (parts.length !== 2 || sign_(parts[0]) !== parts[1]) return null;     // forged or damaged
  try { var u = JSON.parse(unb64_(parts[0])); return u.exp > Date.now() ? u : null; } catch (e) { return null; }
}
function verifyGoogle_(credential) {
  if (!CLIENT_ID || !credential) return null;
  var res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return null;
  var j = JSON.parse(res.getContentText());
  if (j.aud !== CLIENT_ID) return null;                                      // a token made for some other app
  if (String(j.email_verified) === 'false') return null;
  if (Number(j.exp) * 1000 < Date.now()) return null;
  var email = clean_(j.email, 120).toLowerCase();
  return { sub: String(j.sub), name: clean_(j.name || j.given_name || email.split('@')[0], 40), email: email };
}
function isAdmin_(email) {
  email = String(email || '').toLowerCase();
  for (var i = 0; i < ADMIN_EMAILS.length; i++) if (String(ADMIN_EMAILS[i]).toLowerCase() === email && email) return true;
  return false;
}
/** Who is making this request? { id, name, email, uid, admin } or null. */
function who_(src) {
  var me;
  if (CLIENT_ID) {
    var u = readSession_(src.session);
    if (!u) return null;
    me = { id: String(u.sub), name: u.name, email: String(u.email || '').toLowerCase() };
  } else {
    var v = clean_(src.voter, 40);
    if (!v) return null;
    me = { id: v, name: clean_(src.name, 40), email: '' };
  }
  me.uid = uid_(me.email ? me.email : 'v:' + me.id);
  me.admin = isAdmin_(me.email);
  return me;
}

/* ---------- reading (cached: most visitors never touch the sheet) ---------- */
function cached_(key, ttl, build) {
  var cache = CacheService.getScriptCache(), s = cache.get(key);
  if (s) { try { return JSON.parse(s); } catch (e) { /* rebuild */ } }
  var v = build();
  try { cache.put(key, JSON.stringify(v), ttl); } catch (e) { /* too big to cache: fine */ }
  return v;
}
function buildVotes_() {
  var sh = sheet_('Votes', V_HEAD), n = sh.getLastRow();
  if (n < 2) return [];
  var rng = sh.getRange(2, 1, n - 1, 8), rows = rng.getValues(), fix = false;
  var uids = rows.map(function (r) {
    if (!r[7]) { r[7] = uid_(r[6] ? r[6] : 'v:' + r[1]); fix = true; }          // older rows: fill in the missing Uid once
    return [r[7]];
  });
  if (fix) sh.getRange(2, 8, n - 1, 1).setValues(uids);
  return rows.map(function (r) { return { u: String(r[7]), n: String(r[5] || ''), t: String(r[2]), id: String(r[3]) }; });
}
function buildComments_() {
  var sh = sheet_('Questions', Q_HEAD), n = sh.getLastRow();
  if (n < 2) return [];
  var rows = sh.getRange(2, 1, n - 1, 11).getValues(), fixC = false, fixU = false;
  var cids = [], uids = [];
  rows.forEach(function (r, i) {
    if (!r[8]) { r[8] = 'c' + (new Date().getTime() + i).toString(36) + 'x' + i; fixC = true; }
    if (!r[9] && r[7]) { r[9] = uid_(r[7]); fixU = true; }
    cids.push([r[8]]); uids.push([r[9] || '']);
  });
  if (fixC) sh.getRange(2, 9, n - 1, 1).setValues(cids);
  if (fixU) sh.getRange(2, 10, n - 1, 1).setValues(uids);
  var list = rows.map(function (r) {
    return { cid: String(r[8]), id: String(r[2]), venue: String(r[1]), name: String(r[3] || ''), uid: String(r[9] || ''), text: String(r[4]), lang: String(r[5] || ''), reply: String(r[6] || ''), time: iso_(r[0]), edited: iso_(r[10]) };
  });
  return list.slice(-300);
}
function summary_(me) {
  var res = { ok: true, login: !!CLIENT_ID, votes: cached_(CK_VOTES, 600, buildVotes_), comments: cached_(CK_COMMENTS, 300, buildComments_) };
  if (me) res.me = { uid: me.uid, name: me.name, admin: me.admin };
  return res;
}
function dropCache_(votes, comments) {
  var cache = CacheService.getScriptCache();
  if (votes) cache.remove(CK_VOTES);
  if (comments) cache.remove(CK_COMMENTS);
}
/** Typing a Reply (or deleting a row) in the sheet by hand clears the cache, so the website shows it straight away. */
function onEdit() { CacheService.getScriptCache().removeAll([CK_VOTES, CK_COMMENTS]); }
function onOpen() { try { SpreadsheetApp.getUi().createMenu('Countdown').addItem('Refresh Results now', 'refreshResults').addToUi(); } catch (e) { /* not opened from the sheet */ } }
function refreshResults() { updateResults_(); }

/* ---------- Results tab ---------- */
function updateResults_() {
  var sh = sheet_('Votes', V_HEAD), n = sh.getLastRow(), rows = n > 1 ? sh.getRange(2, 1, n - 1, 8).getValues() : [], by = {}, order = [];
  rows.forEach(function (r) {
    var id = String(r[3]); if (!id) return;
    if (!by[id]) { by[id] = { venue: r[4], picks: [], likes: [] }; order.push(id); }
    var who = r[5] || r[1];
    if (r[2] === 'pick') by[id].picks.push(who);
    if (r[2] === 'like') by[id].likes.push(who);
  });
  order.sort(function (a, b) { return (by[b].picks.length - by[a].picks.length) || (by[b].likes.length - by[a].likes.length); });
  var out = [R_HEAD];
  order.forEach(function (id) { var r = by[id]; out.push([r.venue, id, r.picks.length, r.likes.length, r.picks.join(', '), r.likes.join(', ')]); });
  var rs = sheet_('Results', R_HEAD);
  rs.clearContents();
  rs.getRange(1, 1, out.length, R_HEAD.length).setValues(out);
}
/** Rewriting the Results tab costs time, so after a vote it is done at most once every 30 seconds; the next vote or visit catches up. */
function touchResults_() {
  var cache = CacheService.getScriptCache();
  if (cache.get('resultsAt')) { cache.put('resultsDirty', '1', 3600); return; }
  updateResults_();
  cache.put('resultsAt', '1', 30);
  cache.remove('resultsDirty');
}
function catchUpResults_() {
  var cache = CacheService.getScriptCache();
  if (cache.get('resultsDirty') && !cache.get('resultsAt')) {
    var lock = LockService.getScriptLock();
    if (lock.tryLock(0)) { try { touchResults_(); } catch (err) { console.error('Results refresh failed: ' + err); } finally { lock.releaseLock(); } }   // a Results-tab problem must never break the page load
  }
}

/* ---------- web app ---------- */
function doGet(e) {
  var p = (e && e.parameter) || {};
  var out = summary_(who_(p));
  catchUpResults_();
  return out_(out);
}

function isMine_(r, me) { return r[7] ? String(r[7]) === me.uid : (me.email ? String(r[6]).toLowerCase() === me.email : String(r[1]) === me.id); }

function doPost(e) {
  var lock = LockService.getScriptLock(), locked = false;
  try {
    lock.waitLock(20000);                                                          // inside the try: a busy sheet answers with JSON ("Lock timeout") and the page retries, instead of a Google error page
    locked = true;
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.website) return out_({ ok: false, error: 'rejected' });                // honeypot field, humans leave it empty
    var action = body.action;

    if (action === 'login') {
      if (!CLIENT_ID) return out_({ ok: false, error: 'login is not enabled' });
      var g = verifyGoogle_(body.credential);
      if (!g) return out_({ ok: false, error: 'google sign-in failed' });
      var m = { id: g.sub, name: g.name, email: g.email };
      m.uid = uid_(m.email); m.admin = isAdmin_(m.email);
      return out_({ ok: true, login: true, session: makeSession_(g), me: { uid: m.uid, name: m.name, admin: m.admin } });
    }

    var me = who_(body);
    if (!me) return out_({ ok: false, error: CLIENT_ID ? 'login required' : 'missing voter' });
    var id = clean_(body.id, 40), venue = clean_(body.venue, 120), now = new Date();

    if (action === 'like' || action === 'pick') {
      if (!id) return out_({ ok: false, error: 'missing id' });
      var sh = sheet_('Votes', V_HEAD), n = sh.getLastRow(), rows = n > 1 ? sh.getRange(2, 1, n - 1, 8).getValues() : [];
      if (action === 'like') {
        var found = 0;
        for (var i = rows.length - 1; i >= 0; i--) if (isMine_(rows[i], me) && rows[i][2] === 'like' && String(rows[i][3]) === id) { found = i + 2; break; }
        if (body.on && !found) sh.appendRow([now, me.id, 'like', id, venue, me.name, me.email, me.uid]);
        if (!body.on && found) sh.deleteRow(found);
      } else {
        for (var k = rows.length - 1; k >= 0; k--) if (isMine_(rows[k], me) && rows[k][2] === 'pick') sh.deleteRow(k + 2);
        if (body.on !== false) sh.appendRow([now, me.id, 'pick', id, venue, me.name, me.email, me.uid]);
      }
      dropCache_(true, false);
      try { touchResults_(); } catch (err) { console.error('Results refresh failed: ' + err); }   // the vote is already saved: a problem in the Results tab must not make it look failed
      return out_({ ok: true });
    }

    if (action === 'comment') {
      var text = clean_(body.text, 600);
      if (!id || !text) return out_({ ok: false, error: 'empty text' });
      var qs0 = sheet_('Questions', Q_HEAD), want = String(body.cid || '');
      var cid = /^[a-z0-9]{8,24}$/.test(want) ? want : 'c' + now.getTime().toString(36) + Math.random().toString(36).slice(2, 5);
      if (cid === want) {                                                      // the page re-sent the same comment after a bad connection: do not add it twice
        var qn0 = qs0.getLastRow(), have = qn0 > 1 ? qs0.getRange(2, 9, qn0 - 1, 1).getValues() : [];
        for (var h = 0; h < have.length; h++) if (String(have[h][0]) === cid) return out_({ ok: true, cid: cid, time: now.toISOString() });
      }
      qs0.appendRow([now, venue, id, me.name, text, clean_(body.lang, 4), '', me.email, cid, me.uid, '']);
      dropCache_(false, true);
      return out_({ ok: true, cid: cid, time: now.toISOString() });
    }

    if (action === 'edit_comment' || action === 'delete_comment') {
      var qs = sheet_('Questions', Q_HEAD), qn = qs.getLastRow(), cids = qn > 1 ? qs.getRange(2, 9, qn - 1, 2).getValues() : [], row = 0, owner = '';
      for (var j = cids.length - 1; j >= 0; j--) if (String(cids[j][0]) === String(body.cid)) { row = j + 2; owner = String(cids[j][1]); break; }
      if (!row) return out_({ ok: false, error: 'not found' });
      var mine = owner && owner === me.uid;
      if (action === 'edit_comment') {
        var nt = clean_(body.text, 600);
        if (!mine) return out_({ ok: false, error: 'not allowed' });
        if (!nt) return out_({ ok: false, error: 'empty text' });
        qs.getRange(row, 5).setValue(nt);
        qs.getRange(row, 11).setValue(now);
        dropCache_(false, true);
        return out_({ ok: true, edited: now.toISOString() });
      }
      if (!mine && !me.admin) return out_({ ok: false, error: 'not allowed' });
      qs.deleteRow(row);
      dropCache_(false, true);
      return out_({ ok: true });
    }

    return out_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    if (locked) lock.releaseLock();
  }
}
