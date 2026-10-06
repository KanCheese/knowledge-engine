/**
 * Google Apps Script — stores waitlist signups in a Google Sheet.
 *
 * Setup:
 * 1. Create a new Google Sheet (e.g. "ShaadiSnap Waitlist")
 * 2. Extensions → Apps Script → paste this file → Save
 * 3. Project Settings → Script properties → add:
 *      WEBHOOK_SECRET = (same long random string as Vercel WAITLIST_WEBHOOK_SECRET)
 * 4. Deploy → New deployment → Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 5. Copy the Web App URL → Vercel env WAITLIST_WEBHOOK_URL
 *
 * Security:
 * - Sheet is private to your Google account (only you can open it)
 * - Webhook rejects requests without the correct secret header
 * - Vercel API sits in front — webhook URL is never exposed to browsers
 */
function doPost(e) {
  var secret = PropertiesService.getScriptProperties().getProperty("WEBHOOK_SECRET");
  var headerSecret = e.parameter.secret;

  if (e.postData && e.postData.headers) {
    var headers = e.postData.headers;
    if (headers["X-Waitlist-Secret"]) headerSecret = headers["X-Waitlist-Secret"];
    if (headers["x-waitlist-secret"]) headerSecret = headers["x-waitlist-secret"];
  }

  if (secret && headerSecret !== secret) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: "Unauthorized" }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "signed_up_at",
      "phone",
      "name",
      "lang",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "referrer",
      "page_url",
    ]);
  }

  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.signed_up_at || new Date().toISOString(),
    data.phone || "",
    data.name || "",
    data.lang || "",
    data.utm_source || "",
    data.utm_medium || "",
    data.utm_campaign || "",
    data.utm_content || "",
    data.utm_term || "",
    data.referrer || "",
    data.page_url || "",
  ]);

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true }),
  ).setMimeType(ContentService.MimeType.JSON);
}
