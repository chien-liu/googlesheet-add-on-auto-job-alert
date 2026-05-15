/* eslint-disable no-unused-vars */
// All functions here are helpers consumed by services.gs (cross-file globals).

// ============================================================
// General Scanner（LinkedIn, Indeed）
// opts: { sheetName, sender, parser, label }
// ============================================================
function scanEmailSource(ss, opts) {
  try {
    return _scanEmailSourceImpl(ss, opts);
  } catch (e) {
    Logger.log("ERROR in " + opts.label + " scan: " + e.message + "\n" + e.stack);
    return 0;
  }
}

function _scanEmailSourceImpl(ss, opts) {
  Logger.log("--- " + opts.label + " scan start ---");
  var settings = getSettings();
  var sheet = getOrCreateSheet(ss, opts.sheetName, JOB_ENTRY_HEADERS, "#1a73e8");
  var existingLinks = getExistingLinks(sheet, 8);
  Logger.log(opts.label + " existing links: " + Object.keys(existingLinks).length);

  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - settings.daysToScan);
  var dateStr = Utilities.formatDate(cutoff, Session.getScriptTimeZone(), "yyyy/MM/dd");
  Logger.log("Searching " + opts.label + " emails since: " + dateStr);
  var threads = GmailApp.search("from:" + opts.sender + " after:" + dateStr);
  Logger.log("Found " + threads.length + " Gmail thread(s)");

  var newJobs = [];

  for (var t = 0; t < threads.length; t++) {
    var messages = threads[t].getMessages();
    Logger.log("Thread " + (t + 1) + ": " + messages.length + " message(s)");
    for (var m = 0; m < messages.length; m++) {
      var msg = messages[m];
      var emailDate = msg.getDate();
      var jobs = opts.parser(msg.getBody());
      Logger.log(
        "  Message " + (m + 1) + " (" + emailDate.toDateString() + "): parsed " + jobs.length + " job(s)"
      );

      for (var j = 0; j < jobs.length; j++) {
        var job = jobs[j];
        if (!job.link) {
          Logger.log("    Skip: no link - " + job.title);
          continue;
        }
        if (existingLinks[job.link]) {
          Logger.log("    Skip: already exists - " + job.title);
          continue;
        }
        var score = calcScore(job, settings);
        Logger.log(
          "    Add: [" + score.total + "pt] " + job.title + " @ " + job.company + " (" + job.workType + ")"
        );
        newJobs.push([
          Utilities.formatDate(emailDate, Session.getScriptTimeZone(), "yyyy-MM-dd"),
          job.title,
          job.company,
          job.location,
          job.workType,
          score.total,
          score.reasons,
          job.link,
          "Not Applied",
        ]);
        existingLinks[job.link] = true;
      }
    }
  }

  if (newJobs.length > 0) {
    sheet.insertRowsBefore(2, newJobs.length);
    sheet.getRange(2, 1, newJobs.length, JOB_ENTRY_HEADERS.length).setValues(newJobs);
  }

  sortSheetByStatusAndScore(sheet, 8, 5);
  applyStatusValidation(sheet, JOB_ENTRY_HEADERS.length);

  Logger.log("--- " + opts.label + " scan end: " + newJobs.length + " new job(s) ---");
  return newJobs.length;
}

function parseLinkedInEmail(htmlBody) {
  var jobs = [];
  var foundIds = {};

  // Each job card anchor has jobcard_body_{jobId} in its trk param.
  // The anchor text is the job title; company · location follows after </a>.
  var cardRegex = /href="(https:\/\/[^"]+jobcard_body_(\d+)[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  var m;

  while ((m = cardRegex.exec(htmlBody)) !== null) {
    var rawLink = m[1];
    var jobId = m[2];
    var titleRaw = m[3];

    if (foundIds[jobId]) continue;
    foundIds[jobId] = true;

    // Extract clean base URL
    var baseMatch = /(https:\/\/www\.linkedin\.com\/comm\/jobs\/view\/\d+)/.exec(rawLink);
    if (!baseMatch) continue;
    var link = baseMatch[1];

    // Strip any HTML tags from title (there shouldn't be any, but just in case)
    var title = titleRaw.replace(/<[^>]+>/g, "").trim();
    if (!title || title.length < 3) continue;

    // Company and location are in the ~600 chars after </a> as "Company &middot; Location"
    var afterEnd = m.index + m[0].length;
    var afterRaw = htmlBody.substring(afterEnd, afterEnd + 600);
    var plain = cleanHtml(afterRaw.replace(/&middot;/g, "·"));

    var dotIdx = plain.indexOf("·");
    var company = dotIdx > -1 ? plain.substring(0, dotIdx).trim() : "";
    var locationRaw = dotIdx > -1 ? plain.substring(dotIdx + 1).trim() : "";

    // Clean up trailing noise (split on < handles truncated tags at window boundary)
    locationRaw = locationRaw.split("<")[0].trim();
    locationRaw = locationRaw.split(/\s{2,}/)[0].trim();
    locationRaw = locationRaw.replace(/https?:\/\/\S+/g, "").trim();
    if (locationRaw.length > 50) locationRaw = locationRaw.substring(0, 50).trim();
    if (company.length > 60) company = company.substring(0, 60).trim();

    var workType = detectWorkType(title + " " + locationRaw);
    var location = locationRaw.replace(/\(.*?\)/g, "").trim();

    Logger.log(
      "LinkedIn 解析：" + title + " @ " + company + "（" + location + "）[" + workType + "] " + link
    );
    jobs.push({
      title: title,
      company: company,
      location: location,
      workType: workType,
      link: link,
    });
  }

  return jobs;
}

function parseIndeedEmail(htmlBody) {
  var jobs = [];
  var foundIds = {};

  // Each job card has an anchor: <a href="...jk=<hex>...">Job Title</a>
  // Company is in a <td style="padding:0 12px 0 0...">Company</td> after the anchor.
  // Location is in a <td align="left" valign="top" style="color:#2d2d2d...">Location</td>.
  var anchorRe = /<a\s[^>]*href="(https:\/\/[^"]*jk=([a-f0-9]+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  var m;

  while ((m = anchorRe.exec(htmlBody)) !== null) {
    var jk = m[2];
    var titleRaw = m[3];

    if (foundIds[jk]) continue;

    var title = titleRaw.replace(/<[^>]+>/g, "").trim();
    if (!title || title.length < 3) continue;

    foundIds[jk] = true;

    var link = "https://www.indeed.com/viewjob?jk=" + jk;

    var afterEnd = m.index + m[0].length;
    var chunk = htmlBody.substring(afterEnd, afterEnd + 900);

    var compM = /padding:0 12px 0 0[^>]*>([^<]+)<\/td>/.exec(chunk);
    var locM = /<td align="left" valign="top" style="color:#2d2d2d[^>]*>([^<]+)<\/td>/.exec(chunk);

    var company = compM ? compM[1].trim() : "";
    var location = locM ? locM[1].trim() : "";

    if (company.length > 60) company = company.substring(0, 60).trim();
    if (location.length > 50) location = location.substring(0, 50).trim();

    var workType = detectWorkType(title + " " + location);

    Logger.log(
      "Indeed parsed: " + title + " @ " + company + " (" + location + ") [" + workType + "] " + link
    );
    jobs.push({
      title: title,
      company: company,
      location: location,
      workType: workType,
      link: link,
    });
  }

  if (jobs.length === 0 && htmlBody && htmlBody.length > 500) {
    Logger.log(
      "WARNING: parseIndeedEmail returned 0 jobs from a non-empty email body (" +
        htmlBody.length +
        " chars). The email HTML structure may have changed."
    );
  }

  return jobs;
}

function detectWorkType(text) {
  if (/remote|遠端|wfh|work from home|anywhere|全遠端|完全遠端/i.test(text)) return "Remote";
  if (/hybrid|混合|部分遠端/i.test(text)) return "Hybrid";
  if (/on-site|onsite|on site|現場辦公/i.test(text)) return "On-site";
  return "x";
}

function calcScore(job, settings) {
  var titleAndLocation = (job.title + " " + job.location).toLowerCase();
  var total = 0;
  var reasons = [];

  // Work type bonus (fixed scores)
  if (job.workType === "Remote") {
    total += 2;
    reasons.push(t("scoreReasonRemote"));
  } else if (job.workType === "Hybrid") {
    total += 1;
    reasons.push(t("scoreReasonHybrid"));
  }

  // Title match
  var titleScore = 0;
  for (let i = 0; i < settings.titleKeywords.length; i++) {
    if (titleAndLocation.indexOf(settings.titleKeywords[i].toLowerCase()) > -1) {
      titleScore += 1;
    }
  }
  if (titleScore > 0) {
    reasons.push(t("scoreReasonTitle") + " +" + titleScore);
    total += titleScore;
  }

  // Domain match
  var domainText = (job.title + " " + job.company).toLowerCase();
  var domainScore = 0;
  for (let i = 0; i < settings.domainKeywords.length; i++) {
    if (domainText.indexOf(settings.domainKeywords[i].toLowerCase()) > -1) {
      domainScore += 1;
    }
  }
  if (domainScore > 0) {
    reasons.push(t("scoreReasonDomain") + " +" + domainScore);
    total += domainScore;
  }

  // Location match
  var locationScore = 0;
  for (let i = 0; i < settings.locationKeywords.length; i++) {
    if (titleAndLocation.indexOf(settings.locationKeywords[i].toLowerCase()) > -1) {
      locationScore += 1;
    }
  }
  if (locationScore > 0) {
    reasons.push(t("scoreReasonLocation") + " +" + locationScore);
    total += locationScore;
  }

  return { total: total, reasons: reasons.length > 0 ? reasons.join(" / ") : t("scoreReasonNone") };
}

function sortSheetByStatusAndScore(sheet, statusColIdx, scoreColIdx) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  var numCols = sheet.getLastColumn();
  var data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
  data.sort(function (a, b) {
    var sa = STATUS_ORDER[a[statusColIdx]] !== undefined ? STATUS_ORDER[a[statusColIdx]] : 99;
    var sb = STATUS_ORDER[b[statusColIdx]] !== undefined ? STATUS_ORDER[b[statusColIdx]] : 99;
    if (sa !== sb) return sa - sb;
    return b[scoreColIdx] - a[scoreColIdx];
  });
  sheet.getRange(2, 1, data.length, numCols).setValues(data);
}

// ============================================================
// Helpers for parsing and sheet manipulation
// ============================================================
function cleanHtml(html) {
  var result = html.replace(/[\r\n\t]/g, " ");
  result = result.replace(/<!--[\s\S]*?-->/g, " ");
  result = result.replace(/<style[\s\S]*?<\/style>/gi, " ");
  result = result.replace(/<[^>]+>/g, " ");
  result = result.replace(/&middot;/g, "·");
  result = result.replace(/&amp;/g, "&");
  result = result.replace(/&nbsp;/g, " ");
  result = result.replace(/&lt;/g, "<");
  result = result.replace(/&gt;/g, ">");
  result = result.replace(/&#[0-9]+;/g, " ");
  result = result.replace(/&[a-z]+;/gi, " ");
  result = result.replace(/\s+/g, " ");
  return result.trim();
}

function getOrCreateSheet(ss, name, headers, headerColor) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground(headerColor || "#1a1a2e");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
  }
  return sheet;
}

function getExistingLinks(sheet, linkCol) {
  var data = sheet.getDataRange().getValues();
  var links = {};
  for (var i = 1; i < data.length; i++) {
    if (data[i][linkCol - 1]) links[data[i][linkCol - 1]] = true;
  }
  return links;
}

// Apply dropdown validation and conditional-format colors to the "Application Status" column for all data rows.
function applyStatusValidation(sheet, totalCols) {
  var lastRow = sheet.getMaxRows();
  if (lastRow < 2) return;
  var colRange = sheet.getRange(2, totalCols, lastRow - 1, 1);

  var statusValues = Object.keys(STATUS_ORDER).sort(function (a, b) {
    return STATUS_ORDER[a] - STATUS_ORDER[b];
  });
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(statusValues, true)
    .setAllowInvalid(false)
    .build();
  colRange.setDataValidation(rule);

  // Remove existing conditional format rules that target this column, then re-add them.
  var existingRules = sheet.getConditionalFormatRules().filter(function (r) {
    return !r.getRanges().some(function (rng) {
      return rng.getColumn() === totalCols;
    });
  });
  var newRules = statusValues.map(function (status) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(status)
      .setBackground(STATUS_COLORS[status])
      .setFontColor(STATUS_FONT_COLORS[status])
      .setRanges([colRange])
      .build();
  });
  sheet.setConditionalFormatRules(existingRules.concat(newRules));
}
