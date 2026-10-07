/**
 * SHAADISNAP WAITLIST — paste in Apps Script (from inside your Google Sheet)
 *
 * Setup:
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Delete default code → paste this entire file → Save
 * 3. Project Settings → Script properties → WEBHOOK_SECRET = (optional, match Vercel)
 * 4. Deploy → New deployment → Web app
 *      Execute as: Me
 *      Who has access: Anyone
 * 5. Copy the NEW /exec URL → Vercel env WAITLIST_WEBHOOK_URL → Redeploy
 *
 * Test: open the /exec URL in browser — should show {"ok":true,"message":"ShaadiSnap waitlist webhook"}
 */
function doGet() {
  return jsonResponse({ ok: true, message: "ShaadiSnap waitlist webhook" });
}

function doPost(e) {
  try {
    var expected = PropertiesService.getScriptProperties().getProperty("WEBHOOK_SECRET");
    var data = JSON.parse(e.postData.contents);
    var provided = data.webhook_secret || "";

    if (expected && provided !== expected) {
      return jsonResponse({ error: "Unauthorized" });
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

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
