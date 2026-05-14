/* eslint-disable no-unused-vars */
// All variables and functions in this file are intentionally global — consumed by other .gs files.

var CONFIG = {
  SHEET_LINKEDIN: "LinkedIn Jobs",
  SHEET_INDEED: "Indeed Jobs",

  SENDER_LINKEDIN: "jobalerts-noreply@linkedin.com",
  SENDER_INDEED: "donotreply@jobalert.indeed.com",
};

var JOB_ENTRY_HEADERS = [
  "Date",
  "Job Title",
  "Company",
  "Location",
  "Work Type",
  "Score",
  "Score Details",
  "JD Link",
  "Application Status",
];

// Sort order: Not Applied first, then Applied, then Pass
var STATUS_ORDER = { "Not Applied": 0, Applied: 1, Pass: 2 };
var STATUS_COLORS = { "Not Applied": "#FFCFC9", Applied: "#D4EDBC", Pass: "#3D3D3D" };
var STATUS_FONT_COLORS = { "Not Applied": "#C91600", Applied: "#548624", Pass: "#D8D8D8" };

function getDefaultSettings() {
  return {
    titleKeywords: ["senior", "machine learning", "platform"],
    domainKeywords: ["aucoustic", "chatbot", "automotive", "healthcare"],
    locationKeywords: ["berlin", "munich", "taipei"],
    daysToScan: 7,
    isLinkedInEnabled: true,
    isIndeedEnabled: true,
  };
}

function getSettings() {
  var props = PropertiesService.getScriptProperties();
  var defaults = getDefaultSettings();
  return {
    titleKeywords: JSON.parse(props.getProperty("TITLE_KEYWORDS") || JSON.stringify(defaults.titleKeywords)),
    domainKeywords: JSON.parse(
      props.getProperty("DOMAIN_KEYWORDS") || JSON.stringify(defaults.domainKeywords)
    ),
    locationKeywords: JSON.parse(
      props.getProperty("LOCATION_KEYWORDS") || JSON.stringify(defaults.locationKeywords)
    ),
    daysToScan: parseInt(props.getProperty("DAYS_TO_SCAN") || String(defaults.daysToScan), 10),
    isLinkedInEnabled:
      (props.getProperty("IS_LINKEDIN_ENABLED") || String(defaults.isLinkedInEnabled)) === "true",
    isIndeedEnabled: (props.getProperty("IS_INDEED_ENABLED") || String(defaults.isIndeedEnabled)) === "true",
  };
}
