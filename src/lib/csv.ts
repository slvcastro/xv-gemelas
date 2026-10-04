type Cell = string | number | null | undefined;

function escapeCell(value: Cell) {
  let text = value == null ? "" : String(value);
  // Neutralize spreadsheet formulas typed by guests (e.g. "=HYPERLINK(...)").
  if (/^[=@]/.test(text) || /^[+-][^\d\s]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** CSV with a UTF-8 BOM so Excel shows accents (á, é, ñ…) correctly. */
export function toCsv(rows: Cell[][]) {
  return "﻿" + rows.map((row) => row.map(escapeCell).join(",")).join("\r\n") + "\r\n";
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
