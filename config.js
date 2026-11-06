/* ==========================================================================
   Settings you may change.
   --------------------------------------------------------------------------
   sheetUrl: paste the Google Apps Script "Web app" URL here to share votes and
             questions between everyone (see README, section "投票和留言").
             While it is empty, votes and questions are kept on each phone only.
   googleClientId: your Google OAuth Client ID (looks like 1234-abcd.apps.googleusercontent.com). With sheetUrl AND this set,
             people must sign in with Google to like, vote and ask. Leave it empty to ask for a typed name instead.
   participants: number of people, used for "per person" on the Compare page.
   userPhotosFirst: true shows the photos you added yourself first; false puts them after the Airbnb / website photos.
   shortlist: the ids of the only places to show, e.g. ["batu_gajah", "gm_pool_pd"]. All other places are hidden, not deleted (their likes stay in the sheet).
             Empty list [] = show every place. Ids are the "id" values in data/properties.js.
   ========================================================================== */
window.APP_CONFIG = {
  "sheetUrl": "https://script.google.com/macros/s/AKfycby2KwJv0Q5_Yy9Uk-Gs6oyPG_uqzqgk7OTcjBN5eG3rYASDmVrrCojW95eZIdMgLdWIPQ/exec",
  "googleClientId": "697249602311-eqgen5h437mlbv1ib5a004h9ap1g2unr.apps.googleusercontent.com",
  "participants": 25,
  "userPhotosFirst": true,
  "shortlist": ["batu_gajah", "aoya_villa", "gm_pool_pd"]
};
