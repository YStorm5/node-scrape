# Scrape

Module to scrape data from a website using [JSDom](https://www.npmjs.com/package/jsdom) and [Puppeteer](https://www.npmjs.com/package/puppeteer).

## Installation

To use this code, you need to have Node installed on your system. You can install Node by following the instructions at [nodejs](https://nodejs.org/en/download/package-manager).

## Usage

### `scrape(url:string,wait?:string | number): Promise<Scrape>`

-   **url** - Url of website to scrape
-   **wait** - Optional. Waits for the website to load, useful if the website needs to run some scripts before populating elements.

```javascript
import { scrape } from "@ystorm5/scrape";

const scraper = await scrape(url);

// Wait for 200ms
const scraper = await scrape(url, 200);

// Wait until an h1 element is loaded
const scraper = await scrape(url, "h1");
```

### Methods

#### `html(selector: string): string[]`

This method scrapes the `innerHTML` of the target element(s) matching the CSS selector and returns an array of strings.

```javascript
const innerHTMLList = scraper.html("selector");
```

#### `text(selector: string): string[]`

This method scrapes the `innerText` of the target element(s) matching the CSS selector and returns an array of strings.

```javascript
const innerTextList = scraper.text("selector");
```

#### `href(selector: string): string[]`

This method scrapes the `href` attribute of the target element(s) matching the CSS selector and returns an array of strings.

```javascript
const hrefList = scraper.href("selector");
```

#### `attr(selector: string, attribute: string): string[]`

This method scrapes the specified attribute of the target element(s) matching the CSS selector and returns an array of strings.

```javascript
const attrList = scraper.attr("selector", "attribute");
```

#### `table(selector: string, skip: number): TableData[]`

This method scrapes the data of the target table and returns an array of object.

-   **skip**: Number of rows to skip, usually the table header, which will be used as object properties.

```javascript
const data = scraper.table("table");

// Skip the first 2 rows of tbody
const data = scraper.table("table", 2);
```

### Example

Here's an example of how to use the `scrape` function to scrape data from a website:

```javascript
import { scrape } from "@ystorm5/scrape";

const url = "https://example.com";
try {
    const scraper = await scrape(url);
    const titleList = scraper.text("h1");
    console.log(titleList);
} catch (error) {
    console.error(error);
}
```
