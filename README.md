# BuddyBoss Release Notes Searcher

This project scrapes release notes from the [BuddyBoss Release Notes](https://www.buddyboss.com/resources/release-notes/) page using Puppeteer, saves the data in JSON format, and displays it in a searchable, filterable DataTable on a web page.

## Features

- **Automated Scraping:** Uses Puppeteer to extract release notes, changelogs, and metadata for all BuddyBoss products.
- **Incremental Updates:** On subsequent runs, only scrapes new or updated release notes, avoiding duplicates.
- **JSON Storage:** All scraped data is stored in `all-releases.json`, and scraped URLs are tracked in `scraped-urls.json`.
- **Interactive Web UI:** Data is displayed in `index.html` using DataTables, with custom search highlighting and responsive design.
- **Custom Styling:** Modern, responsive CSS for a clean and user-friendly interface.

## Project Structure

```
all-releases.json         # All scraped release data (JSON)
scraped-urls.json         # Tracks already-scraped changelog URLs
scrapper.mjs              # Puppeteer script for scraping release notes
index.html                # Main web page displaying the data
js/
  script.js               # Loads JSON and initializes DataTable
css/
  style.css               # Custom styles for the UI
images/
  bb.webp                 # BuddyBoss logo
package.json              # Node.js project metadata
README.md                 # This file
```

## How It Works

### 1. Scraping Release Notes

- Run the scraper with Node.js:
  ```sh
  node scrapper.mjs
  ```
- The script:
  - Launches Puppeteer in headless mode.
  - Navigates to the BuddyBoss release notes page.
  - Extracts product names, versions, release dates, and changelog entries.
  - Checks `scraped-urls.json` to avoid re-scraping existing data.
  - Appends new data to `all-releases.json`.

### 2. Displaying Data

- Open `index.html` in your browser.
- The page:
  - Loads release data from a JSON script tag.
  - Uses [DataTables](https://datatables.net/) for searching, sorting, and pagination.
  - Highlights search matches and supports responsive layouts.
  - Custom JS (`js/script.js`) and CSS (`css/style.css`) enhance the user experience.

## Requirements

- Node.js (for running the scraper)
- Internet connection (for scraping and loading external libraries)

## Setup & Usage

1. **Install dependencies:**
   ```sh
   npm install puppeteer
   ```
2. **Scrape the latest release notes:**
   ```sh
   node scrapper.mjs
   ```
3. **Update `index.html` with the latest JSON data:**
   - Copy the contents of `all-releases.json` into the `<script id="releaseData" type="application/json">` tag in `index.html`.
4. **Open `index.html` in your browser to view and search the release notes.**

## Customization

- **Styling:** Edit `css/style.css` for custom themes or dark mode.
- **Functionality:** Modify `js/script.js` to change table behavior or add new features.

## License

MIT

---

*This project is not affiliated with BuddyBoss. It is for educational and informational purposes only.*