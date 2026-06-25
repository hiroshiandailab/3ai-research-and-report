const CONFIG = {
  sharedSecretKey: "GOOGLE_DRIVE_GAS_SHARED_SECRET",
  folderIdKey: "GOOGLE_DRIVE_FOLDER_ID",
};

function doGet() {
  return jsonResponse({
    ok: true,
    service: "3AI Research & Report Google Drive Save",
  });
}

function doPost(event) {
  try {
    const payload = parsePayload(event);
    assertAuthorized(payload);

    const content = normalizeText(payload.content);
    if (!content) {
      return jsonResponse({ ok: false, error: "CONTENT_REQUIRED" }, 400);
    }

    const title = normalizeTitle(payload.title);
    const fileName = `${title}_${formatTimestamp(new Date())}.docx`;
    const doc = DocumentApp.create(`${title}_${formatTimestamp(new Date())}_temp`);
    const body = doc.getBody();
    body.clear();

    const brief = normalizeText(payload.brief);
    if (brief) {
      body.appendParagraph("Main Question").setHeading(DocumentApp.ParagraphHeading.HEADING2);
      appendTextBlock(body, brief);
      body.appendParagraph("");
    }

    body.appendParagraph("Final Report").setHeading(DocumentApp.ParagraphHeading.HEADING2);
    appendTextBlock(body, content);
    doc.saveAndClose();

    const docFile = DriveApp.getFileById(doc.getId());
    const wordBlob = exportGoogleDocAsDocx(doc.getId()).setName(fileName);
    const targetFolder = getTargetFolder();
    const wordFile = targetFolder.createFile(wordBlob);
    docFile.setTrashed(true);

    return jsonResponse({
      ok: true,
      fileId: wordFile.getId(),
      fileName: wordFile.getName(),
      url: wordFile.getUrl(),
    });
  } catch (error) {
    console.error(error);
    return jsonResponse(
      {
        ok: false,
        error: error && error.message ? error.message : "SAVE_FAILED",
      },
      500,
    );
  }
}

function parsePayload(event) {
  if (!event || !event.postData || !event.postData.contents) {
    throw new Error("REQUEST_BODY_REQUIRED");
  }
  return JSON.parse(event.postData.contents);
}

function assertAuthorized(payload) {
  const expected = PropertiesService.getScriptProperties().getProperty(
    CONFIG.sharedSecretKey,
  );
  if (!expected) {
    throw new Error("SHARED_SECRET_NOT_CONFIGURED");
  }
  if (!payload || payload.secret !== expected) {
    throw new Error("UNAUTHORIZED");
  }
}

function getTargetFolder() {
  const folderId = PropertiesService.getScriptProperties().getProperty(
    CONFIG.folderIdKey,
  );
  return folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
}

function exportGoogleDocAsDocx(documentId) {
  const url = `https://docs.google.com/feeds/download/documents/export/Export?id=${documentId}&exportFormat=docx`;
  const response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: `Bearer ${ScriptApp.getOAuthToken()}`,
    },
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(`DOCX_EXPORT_FAILED:${response.getResponseCode()}`);
  }

  return response.getBlob();
}

function appendTextBlock(body, text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  lines.forEach((line) => {
    body.appendParagraph(line);
  });
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim().slice(0, 80000) : "";
}

function normalizeTitle(value) {
  const title = typeof value === "string" ? value.trim() : "";
  const safe = (title || "3AI Research Report")
    .replace(/[\\/:*?"<>|#%{}~&]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return safe || "3AI Research Report";
}

function formatTimestamp(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyyMMdd_HHmmss");
}

function jsonResponse(payload, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
  if (statusCode && output.setStatusCode) {
    output.setStatusCode(statusCode);
  }
  return output;
}
