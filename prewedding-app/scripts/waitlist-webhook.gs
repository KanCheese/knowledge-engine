/**
 * SHAADISNAP WAITLIST — run from INSIDE your Google Sheet
 *
 * ONE-TIME SETUP:
 * 1. Create a Google Sheet called "ShaadiSnap Waitlist"
 * 2. Copy the Sheet ID from the URL:
 *    https://docs.google.com/spreadsheets/d/PASTE_THIS_PART/edit
 * 3. Open that Sheet → Extensions → Apps Script
 * 4. Delete all code → paste this file → Save
 * 5. Project Settings → Script properties → add:
 *      SHEET_ID = (your sheet id from step 2)
 *      WEBHOOK_SECRET = (optional — same as Vercel, or leave empty to test)
 * 6. In Apps Script editor: select doGet → Run → approve permissions
 * 7. Deploy → New deployment → Web app
 *      Execute as: Me | Who has access: Anyone
 * 8. Copy the /exec URL (NOT the sheet URL) → Vercel WAITLIST_WEBHOOK_URL
 *
 * TEST: open /exec in browser → {"ok":true,"message":"ShaadiSnap waitlist webhook"}
 */
function getWaitlistSheet() {
  var sheetId = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  if (!sheetId) {
    throw new Error("Missing SHEET_ID in Script properties");
  }
  return SpreadsheetApp.openById(sheetId).getActiveSheet();
}

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

    var sheet = getWaitlistSheet();

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
