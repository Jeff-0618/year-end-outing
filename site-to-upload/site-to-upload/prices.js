/* ==========================================================================
   PRICES — type the prices here. This is the only file you need for prices.
   --------------------------------------------------------------------------
   "night"      price for ONE night for the whole house, gross, in RM.   e.g.  { "night": 2310 }
   "perPerson"  [lowest, highest] per person, in RM, for places priced per person.   e.g.  { "perPerson": [100, 120] }
   "note"       optional short text shown on the place's page.   e.g.  { "night": 2310, "note": "31 Dec, 20 guests, Airbnb app" }
   null         price not known yet (the page shows "Price to confirm").
   Keep the commas and the quotes exactly as they are. Save, then upload prices.js to the top level of the website.
   ========================================================================== */
window.PRICES = {
  "airbnb_a": { "night": 2310 },     // Highlands Retreat 33 (Bungalow)
  "airbnb_b": { "night": 1743 },     // One 5 Residence Homestay Bungalow
  "airbnb_c": { "night": 1700 },     // Teratak Amandarii (Bungalow)
  "dusun_bonda": { "perPerson": [100, 120] }, // Dusun Bonda — Villas & Bell Tent Glamping
  "pd_pool": { "night": null },      // PD4R3BR 20pax Private Pool Homestay
  "batu_gajah": { "night": null },   // Royale Villa Homestay Private Pool Batu Gajah Ipoh
  "bentong_actb": { "night": null }, // ActB GuestHouse 装B民宿 (Bentong)
  "hh_melaka": { "night": null },    // H&H Leisure Guest House
  "gm_pool_pd": { "night": null }    // GM Pool Villa Port Dickson
};
