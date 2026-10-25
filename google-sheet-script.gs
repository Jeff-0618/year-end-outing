/**
 * Year-End Countdown 2026 — shared votes and questions, stored in YOUR Google Sheet.
 * Works with "Sign in with Google" (recommended) or, if you leave CLIENT_ID empty, with a typed name only.
 *
 * Setup (see GOOGLE-SHEET-SETUP.md):
 *  1. Create a new Google Sheet.  Extensions > Apps Script.  Delete the sample code and paste this whole file.
 *  2. Paste your Google OAuth Client ID between the quotes in CLIENT_ID below (from the Google sign-in setup).
 *  3. Deploy > New deployment > Web app.   Execute as: Me    Who has access: Anyone.   Authorise when asked.
 *  4. Copy the "Web app" URL into config.js as "sheetUrl".
 *
 * The script creates these tabs by itself:
 *   Questions : Time | Venue | VenueId | Name | Question | Lang | Reply | Email    <- write your answer in "Reply"
 *   Votes     : Time | VoterId | Type (like / pick) | VenueId | Venue | Name | Email
 *   Results   : rewritten after every vote: Venue | VenueId | Votes | Likes | Voted by | Liked by   <- the table to read
 */

/** Paste your Google OAuth Client ID here, e.g. '1234567890-abc123.apps.googleusercontent.com'. Empty = no Google sign-in (typed names). */
var CLIENT_ID = '';
var SESSION_DAYS = 60;

var Q_HEAD = ['Time', 'Venue', 'VenueId', 'Name', 'Question', 'Lang', 'Reply', 'Email'];
var V_HEAD = ['Time', 'VoterId', 'Type', 'VenueId', 'Venue', 'Name', 'Email'];
var R_HEAD = ['Venue', 'VenueId', 'Votes (one per person)', 'Likes', 'Voted by', 'Liked by'];

function sheet_(name, head) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(head); }
  return sh;
}
function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function clean_(s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, max); }

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
  var email = clean_(j.email, 120);
  return { sub: String(j.sub), name: clean_(j.name || j.given_name || email.split('@')[0], 40), email: email };
}

/** Who is making this request? Returns { id, name, email } or null. */
function who_(src) {
  if (CLIENT_ID) {
    var u = readSession_(src.session);
    return u ? { id: String(u.sub), name: u.name, email: u.email || '' } : null;
  }
  var v = clean_(src.voter, 40);
  return v ? { id: v, name: clean_(src.name, 40), email: '' } : null;
}

/* ---------- results ---------- */
function updateResults_() {
  var rows = sheet_('Votes', V_HEAD).getDataRange().getValues(), by = {}, order = [];
  for (var i = 1; i < rows.length; i++) {
    var id = String(rows[i][3]); if (!id) continue;
    if (!by[id]) { by[id] = { venue: rows[i][4], picks: [], likes: [] }; order.push(id); }
    var who = rows[i][5] || rows[i][1];
    if (rows[i][2] === 'pick') by[id].picks.push(who);
    if (rows[i][2] === 'like') by[id].likes.push(who);
  }
  order.sort(function (a, b) { return (by[b].picks.length - by[a].picks.length) || (by[b].likes.length - by[a].likes.length); });
  var out = [R_HEAD];
  order.forEach(function (id) { var r = by[id]; out.push([r.venue, id, r.picks.length, r.likes.length, r.picks.join(', '), r.likes.join(', ')]); });
  var sh = sheet_('Results', R_HEAD);
  sh.clearContents();
  sh.getRange(1, 1, out.length, R_HEAD.length).setValues(out);
}

function summary_(me) {
  var votes = sheet_('Votes', V_HEAD).getDataRange().getValues();
  var likes = {}, picks = {}, mine = { likes: [], pick: null };
  for (var i = 1; i < votes.length; i++) {
    var type = votes[i][2], id = String(votes[i][3]);
    if (type === 'like') { likes[id] = (likes[id] || 0) + 1; if (me && String(votes[i][1]) === me.id) mine.likes.push(id); }
    if (type === 'pick') { picks[id] = (picks[id] || 0) + 1; if (me && String(votes[i][1]) === me.id) mine.pick = id; }
  }
  var qs = sheet_('Questions', Q_HEAD).getDataRange().getValues(), comments = [];
  for (var j = 1; j < qs.length; j++) {
    comments.push({ time: qs[j][0] instanceof Date ? qs[j][0].toISOString() : String(qs[j][0]), venue: qs[j][1], id: String(qs[j][2]), name: qs[j][3], text: qs[j][4], lang: qs[j][5], reply: qs[j][6] || '' });
  }
  var res = { ok: true, login: !!CLIENT_ID, likes: likes, picks: picks, mine: mine, comments: comments.slice(-300) };
  if (me && CLIENT_ID) res.me = { name: me.name };
  return res;
}

function doGet(e) {
  return out_(summary_(who_((e && e.parameter) || {})));
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.website) return out_({ ok: false, error: 'rejected' });                // honeypot field, humans leave it empty
    var action = body.action;

    if (action === 'login') {
      if (!CLIENT_ID) return out_({ ok: false, error: 'login is not enabled' });
      var g = verifyGoogle_(body.credential);
      if (!g) return out_({ ok: false, error: 'google sign-in failed' });
      var sum = summary_({ id: g.sub, name: g.name });
      sum.session = makeSession_(g);
      return out_(sum);
    }

    var me = who_(body);
    if (!me) return out_({ ok: false, error: CLIENT_ID ? 'login required' : 'missing voter' });
    var id = clean_(body.id, 40), venue = clean_(body.venue, 120);
    if (!id) return out_({ ok: false, error: 'missing id' });
    var now = new Date();

    if (action === 'like' || action === 'pick') {
      var sh = sheet_('Votes', V_HEAD), rows = sh.getDataRange().getValues();
      if (action === 'like') {
        var found = 0;
        for (var i = rows.length - 1; i >= 1; i--) if (String(rows[i][1]) === me.id && rows[i][2] === 'like' && String(rows[i][3]) === id) { found = i + 1; break; }
        if (body.on && !found) sh.appendRow([now, me.id, 'like', id, venue, me.name, me.email]);
        if (!body.on && found) sh.deleteRow(found);
      } else {
        for (var k = rows.length - 1; k >= 1; k--) if (String(rows[k][1]) === me.id && rows[k][2] === 'pick') sh.deleteRow(k + 1);
        if (body.on !== false) sh.appendRow([now, me.id, 'pick', id, venue, me.name, me.email]);
      }
      updateResults_();
    } else if (action === 'comment') {
      var text = clean_(body.text, 600);
      if (!text) return out_({ ok: false, error: 'empty text' });
      sheet_('Questions', Q_HEAD).appendRow([now, venue, id, me.name, text, clean_(body.lang, 4), '', me.email]);
    } else {
      return out_({ ok: false, error: 'unknown action' });
    }
    return out_(summary_(me));
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
