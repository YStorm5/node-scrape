import { JSDOM } from "jsdom";
import { removeBrackets, toCamelCase } from "./utils.js";
import fetch from "node-fetch";
import puppeteer from "puppeteer";

class Scrape {
  #doc;
  constructor(htmlString) {
    this.#doc = new JSDOM(htmlString);
  }
  /**
   * Scrape the `innerHTML` of the target element.
   * @param selector - The CSS selector of the target element.
   * @returns string[]
   */
  html(selector) {
    const htmlList = [];
    const elements = this.#doc.window.document.querySelectorAll(selector);
    elements.forEach((e) => {
      htmlList.push(e.innerHTML.trim());
    });
    if (htmlList.length < 1) {
      return [];
    } else {
      return htmlList;
    }
  }
  /**
   * Scrape the `innerText` of the target element.
   * @param selector - The CSS selector of the target element.
   * @returns string[]
   */
  text(selector) {
    const textList = [];
    const elements = this.#doc.window.document.querySelectorAll(selector);
    elements.forEach((e) => {
      textList.push(e.textContent.trim());
    });
    if (textList.length < 1) {
      return [];
    } else {
      return textList;
    }
  }
  /**
   * Scrape the `href` of the target element.
   * @param selector - The CSS selector of the target element.
   * @returns string[]
   */
  href(selector) {
    const hrefList = [];
    const elements = this.#doc.window.document.querySelectorAll(selector);
    elements.forEach((e) => {
      const href = e;
      if (!href.hasAttribute("href")) {
        return;
      } else {
        hrefList.push(href.getAttribute("href").trim());
      }
    });
    return hrefList;
  }
  /**
   * Scrape the `attribute` of the target element.
   * @param {string} selector - The CSS selector of the target element.
   * @param {string} attribute - The Attribute of the target element.
   * @returns {string[]} string[]
   */
  attr(selector, attribute) {
    const attrList = [];
    const elements = this.#doc.window.document.querySelectorAll(selector);
    elements.forEach((e) => {
      const href = e;
      if (!href.hasAttribute(attribute)) {
        return;
      } else {
        attrList.push(href.getAttribute(attribute).trim());
      }
    });
    return attrList;
  }
  /**
   * Scrape data from target `table` element.
   * @param {string} selector - The CSS selector of the target table element.
   * @param {number} [skip] - Indicate how many rows to consider as header inside `<tbody>`. If the table has `<thead>`, this parameter is not required.
   * @returns TableData[] - An array of TableData.
   */
  table(selector, skip) {
    const _table = this.#doc.window.document.querySelector(selector);
    const _rows = [];
    const _skipRows = [];
    let _skip = skip ?? 0;
    let _hasHead = false;

    // check if there thead
    if (_table == null) throw new Error("There is no target table");
    const _tbody = _table.querySelector("tbody");
    if (_tbody == null) throw new Error("There is no tbody inside the table");
    const _thead = _table.children;
    for (const ele of _thead) {
      if (ele.nodeName == "THEAD") {
        _hasHead = true;
        ele.querySelectorAll("tr").forEach((e) => {
          const _element = e;
          _skipRows.push(_element);
        });
        _skip = _skipRows.length;
        break;
      }
    }
    _tbody.querySelectorAll("tr").forEach((e, i) => {
      const _element = e;
      if (!_hasHead) {
        if (i < _skip) _skipRows.push(_element);
        else _rows.push(_element);
      } else {
        _rows.push(_element);
      }
    });
    function generateColumn(i, _value, _cols) {
      const _header = {};
      if (i < _skipRows.length) {
        const childrens = Array.from(_skipRows[i].children); // 3
        let same = true;
        childrens.slice(0, _cols ?? childrens.length).forEach((v) => {
          const col = v;
          const colSpan = col.getAttribute("colspan") ?? 1;
          const _cols = +colSpan; // 5
          if (_cols == 1) {
            _header[toCamelCase(removeBrackets(col.textContent))] = _value
              .shift()
              ?.toString()
              .trim();
          } else {
            if (same) {
              ++i;
              same = false;
            }
            _header[toCamelCase(removeBrackets(col.textContent))] =
              generateColumn(i, _value, _cols);
          }
        });
      }
      return _header;
    }

    const tds = _rows?.splice(0, _rows.length).map((e) => {
      const rows = [];
      for (const v of e.children) {
        const el = v;
        const colSpan = el.getAttribute("colspan") ?? 1;
        const cols = +colSpan;
        Array(cols)
          .fill(el.textContent)
          .forEach((v) => {
            rows.push(removeBrackets(v));
          });
      }
      return generateColumn(0, rows);
    });
    return tds;
  }
}
/**
 * `function` to scrape data from website
 * @param url - Url of website to scrape
 * @param wait - Wait for website to load. This is useful if that website need to run some script first before populate element.
 * @example
 * // Wait for 1 second before fetching
 * await scrape("https://www.example.com",1000);
 *
 * // Wait for specific html element to load
 * await scrape("https://www.example.com","h1");
 */
export async function scrape(url, wait) {
  if (url == null) {
    throw "URL can't be empty!";
  }
  let html = "";
  if (wait != null) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    if (typeof wait == "number") {
      await new Promise((r) => setTimeout(r, wait));
    } else if (typeof wait == "string") {
      await page.waitForSelector(wait);
    }
    html = await page.content();
    await browser.close();
  } else {
    const req = await fetch(url);
    html = await req.text();
  }
  const removeScript = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );
  const cleanHtml = removeScript.replace(/\n/g, "");
  return new Scrape(cleanHtml);
}
