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
   ========================================================================== */
window.APP_CONFIG = {
  "sheetUrl": "",
  "googleClientId": "",
  "participants": null,
  "userPhotosFirst": true
};
