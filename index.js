import { JSDOM } from "jsdom";
import {
  extractColumnMap,
  generateColumnLayout,
  extractTableData,
} from "./utils.js";
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
   * @param {number} [skip] - Indicate how many rows to consider as header inside `<table>`.
   * @returns TableData[] - An array of TableData.
   */
  table(selector, skip) {
    const table = this.#doc.window.document.querySelector(selector);
    if (!table) throw new Error("No table found with the given selector");
    const tbody = table.querySelector("tbody");
    if (!tbody) throw new Error("No tbody found in the table");
    const columnMap = extractColumnMap(table, skip);
    // generate column
    const columnLayout = generateColumnLayout(columnMap, 0, 0, "");
    return extractTableData(tbody, columnLayout, skip);
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
