/**
 * Year-End Countdown 2026 — shared votes and questions, stored in YOUR Google Sheet.
 *
 * Setup (about 5 minutes, see README):
 *  1. Create a new Google Sheet.  Extensions > Apps Script.  Delete the sample code and paste this file.
 *  2. Click Deploy > New deployment > type "Web app".
 *       Execute as: Me      Who has access: Anyone
 *  3. Authorise when asked, copy the "Web app" URL and paste it into data/config.js as "sheetUrl".
 *
 * The script creates two tabs by itself:
 *   Questions : Time | Venue | VenueId | Name | Question | Lang | Reply   <- write your answer in "Reply"
 *   Votes     : Time | VoterId | Type (like / pick) | VenueId | Venue
 */
var Q_HEAD = ['Time', 'Venue', 'VenueId', 'Name', 'Question', 'Lang', 'Reply'];
var V_HEAD = ['Time', 'VoterId', 'Type', 'VenueId', 'Venue'];

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

function summary_(voter) {
  var votes = sheet_('Votes', V_HEAD).getDataRange().getValues();
  var likes = {}, picks = {}, mine = { likes: [], pick: null };
  for (var i = 1; i < votes.length; i++) {
    var type = votes[i][2], id = String(votes[i][3]);
    if (type === 'like') { likes[id] = (likes[id] || 0) + 1; if (voter && votes[i][1] === voter) mine.likes.push(id); }
    if (type === 'pick') { picks[id] = (picks[id] || 0) + 1; if (voter && votes[i][1] === voter) mine.pick = id; }
  }
  var qs = sheet_('Questions', Q_HEAD).getDataRange().getValues(), comments = [];
  for (var j = 1; j < qs.length; j++) {
    comments.push({ time: qs[j][0] instanceof Date ? qs[j][0].toISOString() : String(qs[j][0]), venue: qs[j][1], id: String(qs[j][2]), name: qs[j][3], text: qs[j][4], lang: qs[j][5], reply: qs[j][6] || '' });
  }
  return { ok: true, likes: likes, picks: picks, mine: mine, comments: comments.slice(-300) };
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  return out_(summary_(clean_(p.voter, 40)));
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var action = body.action, voter = clean_(body.voter, 40), id = clean_(body.id, 40), venue = clean_(body.venue, 120);
    if (body.website) return out_({ ok: false, error: 'rejected' });          // honeypot field, humans leave it empty
    if (!id) return out_({ ok: false, error: 'missing id' });
    var now = new Date();
    if (action === 'like' || action === 'pick') {
      if (!voter) return out_({ ok: false, error: 'missing voter' });
      var sh = sheet_('Votes', V_HEAD), rows = sh.getDataRange().getValues();
      if (action === 'like') {
        var found = 0;
        for (var i = rows.length - 1; i >= 1; i--) if (rows[i][1] === voter && rows[i][2] === 'like' && String(rows[i][3]) === id) { found = i + 1; break; }
        if (body.on && !found) sh.appendRow([now, voter, 'like', id, venue]);
        if (!body.on && found) sh.deleteRow(found);
      } else {
        for (var k = rows.length - 1; k >= 1; k--) if (rows[k][1] === voter && rows[k][2] === 'pick') sh.deleteRow(k + 1);
        if (body.on !== false) sh.appendRow([now, voter, 'pick', id, venue]);
      }
    } else if (action === 'comment') {
      var text = clean_(body.text, 600);
      if (!text) return out_({ ok: false, error: 'empty text' });
      sheet_('Questions', Q_HEAD).appendRow([now, venue, id, clean_(body.name, 40), text, clean_(body.lang, 4), '']);
    } else {
      return out_({ ok: false, error: 'unknown action' });
    }
    return out_(summary_(voter));
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
