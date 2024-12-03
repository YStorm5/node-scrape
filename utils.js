/**
 * Convert string to camelCase
 * @param input string that will convert to camelCase
 * @returns camelCase string
 */

import { JSDOM } from "jsdom";

export function toCamelCase(input) {
  const words = input.split(" ");
  let camelCaseString = words[0].toLowerCase();
  for (let i = 1; i < words.length; i++) {
    camelCaseString +=
      words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase();
  }
  return camelCaseString;
}

/**
 * Remove unnecessary symbols or characters from the string.
 * @param input string that need to remove
 * @returns clean string text
 */
export function cleanText(input) {
  return input
    .replace(/\[.*?\]/g, "")
    .replace(/['"]/g, "")
    .replace("  ", "-");
}

/**
 * @typedef {Object} Data
 * @property {number} row
 * @property {number} col
 * @property {string} value - The innerText of the column
 */

/**
 * Extract column mapping, handling complex header structures with colspan and rowspan
 * @param {Element | null} table - The table element
 * @param {number} skipRows - Number of header rows to skip
 * @returns {Data[][]} Array of column mapping data
 */
export function extractColumnMap(table, skipRows) {
  const thead = table.querySelector("thead");
  const _thead = thead
    ? Array.from(thead.children).concat(
        Array.from(thead.querySelectorAll("tr"))
      )
    : Array.from(table.querySelectorAll("tr"));

  const columnMap = [];
  for (let trIndex = 0; trIndex < skipRows; trIndex++) {
    const rows = [];
    const tr = Array.from(_thead[trIndex]?.children || []);
    let totalCols = 0;

    for (let thIndex = 0; thIndex < tr.length; thIndex++) {
      const th = tr[thIndex];
      const colspan = parseInt(th.getAttribute("colspan") || "1", 10);
      const rowspan = parseInt(th.getAttribute("rowspan") || "1", 10);
      if (th.textContent === "") {
        totalCols += 1;
        continue;
      } //
      const cell = {
        row: trIndex + 1,
        col: (totalCols += colspan),
        value: toCamelCase(cleanText(th.textContent.trim())),
      };

      // add empty th to next row if rowspan > 1
      if (rowspan > 1) {
        const doc = new JSDOM("<table><tr></tr></table>");
        const thEl = doc.window.document.createElement("th");
        for (let rowSpanIndex = 1; rowSpanIndex < rowspan; rowSpanIndex++) {
          _thead[trIndex + rowSpanIndex].prepend(thEl);
        }
      }

      rows.push(cell);
    }
    columnMap.push(rows);
  }

  return columnMap;
}

/**
 * Recursively generate column layout based on header structure
 * @param {Data[][]} columnMap - Mapped column data
 * @param {number} rowIndex - Current row index
 * @param {number} colSpan - Column span
 * @param {string} columnName - Column name of parent. Used when is no header name.
 * @returns Structured column layout
 */
export function generateColumnLayout(columnMap, rowIndex, colSpan, columnName) {
  const row = columnMap[rowIndex];
  if (!row) {
    const obj = {};
    Array.from({ length: colSpan }, (_, i) => {
      obj[`${columnName}#${i}`] = "###";
    });
    return obj;
  }

  const header = {};
  const columns = rowIndex === 0 ? row : row.splice(0, colSpan);

  columns.forEach((column, columnIndex) => {
    const previousColumn =
      columnIndex !== 0 ? columns[columnIndex - 1] : { col: column.col };

    const colspan = column.col - previousColumn.col;
    header[column.value] =
      colspan === 0 ||
      (colspan === 1 && columnMap[rowIndex + 1]?.at(0)?.col !== column.col)
        ? "###"
        : generateColumnLayout(columnMap, rowIndex + 1, colspan, column.value);
  });

  return header;
}

/**
 * Extract table data into structured format
 * @param {HTMLTableSectionElement | null} tbody - Table body element
 * @param {TableData | string} columnLayout - Generated column layout
 * @param {number} skipRows - Number of header rows to skip
 * @returns Parsed table data
 */
export function extractTableData(tbody, columnLayout, skipRows) {
  const rows = Array.from(tbody.querySelectorAll("tr")).slice(skipRows);
  const existedRow = [];

  return rows.map((row, trIndex) => {
    let jsonTemplate = JSON.stringify(columnLayout);
    const innerData = [];
    const cells = Array.from(row.children);

    cells.forEach((cell, tdIndex) => {
      const colspan = parseInt(cell.getAttribute("colspan") || "1", 10);
      const rowspan = parseInt(cell.getAttribute("rowspan") || "1", 10);

      let value = cleanText(cell.textContent.trim());

      // Remove empty cell
      // if (cell.children.length === 0 && value === "") return "";

      // Try to get image src if text is empty
      if (value === "") {
        const img = cell.querySelector("img");
        value = img?.getAttribute("src") || "";
      }

      if (rowspan > 1) {
        existedRow.push({
          row: trIndex,
          col: tdIndex,
          value: value,
        });
      }

      // Handle multiple column spans
      for (let colIndex = 0; colIndex < colspan; colIndex++) {
        innerData.push(value);
      }
    });

    // Inject existed row values
    const existRow = existedRow.filter((e) => e.row === trIndex - 1);
    existRow.forEach((e) => innerData.splice(e.col, 0, e.value));

    // Replace placeholders with actual values
    innerData.forEach((e) => {
      jsonTemplate = jsonTemplate.replace("###", e);
    });

    return JSON.parse(jsonTemplate);
  });
}
