# Enable the required APIs for an Apps Script Add-on
resource "google_project_service" "required_apis" {
  for_each = toset([
    "script.googleapis.com",              # Apps Script API (allows deployment)
    "sheets.googleapis.com",              # Sheets API
    "gmail.googleapis.com",               # Gmail API (for your gmail.readonly scope)
    "appsmarket-component.googleapis.com" # Google Workspace Marketplace SDK
  ])

  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}
