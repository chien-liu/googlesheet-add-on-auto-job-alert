import js from "@eslint/js";

export default [
  {
    ...js.configs.recommended,
    files: ["**/*.gs", "**/*.js"],
    rules: {
      "no-unused-vars": ["error", { "caughtErrors": "all", "caughtErrorsIgnorePattern": "^_" }],
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        // Google Apps Script globals
        Logger: "readonly",
        SpreadsheetApp: "readonly",
        MailApp: "readonly",
        GmailApp: "readonly",
        UrlFetchApp: "readonly",
        Session: "readonly",
        Utilities: "readonly",
        DriveApp: "readonly",
        Browser: "readonly",
        HtmlService: "readonly",
        ScriptApp: "readonly",
        CalendarApp: "readonly",
        FormApp: "readonly",
        SlidesApp: "readonly",
        DocumentApp: "readonly",
        PropertiesService: "readonly",
        CacheService: "readonly",
        ContentService: "readonly",
        console: "readonly",
      },
    },
  },
];
