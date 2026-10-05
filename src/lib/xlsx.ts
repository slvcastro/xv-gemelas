/**
 * Minimal .xlsx writer with no dependencies: SpreadsheetML parts packed in a ZIP (method "store" +
 * CRC32). Strings are written inline (t="inlineStr"), so cells can never become formulas.
 * Supports: bold header row, column widths, frozen header, autofilter, dates and wrapped text.
 */
import { toExcelSerial } from "@/lib/format";

export type XlsxCell = string | number | boolean | Date | null | undefined;

export type XlsxColumn = {
  header: string;
  /** Width in characters. */
  width: number;
  /** Wrap long text (messages, notes). */
  wrap?: boolean;
};

export type XlsxSheet = {
  /** Max 31 characters, no []:*?/\ */
  name: string;
  columns: XlsxColumn[];
  rows: XlsxCell[][];
  /** Adds Excel's filter arrows to the header (default true). */
  autoFilter?: boolean;
};

// Style indexes in styles.xml (cellXfs).
const STYLE = { normal: 0, header: 1, date: 2, wrap: 3 } as const;

const encoder = new TextEncoder();

const xmlEscape = (value: string) =>
  value
    // Characters not allowed in XML 1.0: control chars and lone surrogates (valid pairs are kept).
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "")
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g, (m) => (m.length === 2 ? m : ""))
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function columnLetter(index: number) {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function cellXml(ref: string, value: XlsxCell, style: number) {
  const s = style ? ` s="${style}"` : "";
  if (value === null || value === undefined || value === "") return style ? `<c r="${ref}"${s}/>` : "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return `<c r="${ref}" s="${STYLE.date}"><v>${toExcelSerial(value)}</v></c>`;
  }
  if (typeof value === "number") return Number.isFinite(value) ? `<c r="${ref}"${s}><v>${value}</v></c>` : "";
  const text = typeof value === "boolean" ? (value ? "Sí" : "No") : value.slice(0, 32_000);
  return `<c r="${ref}" t="inlineStr"${s}><is><t xml:space="preserve">${xmlEscape(text)}</t></is></c>`;
}

function sheetXml(sheet: XlsxSheet, selected: boolean) {
  const lastCol = columnLetter(Math.max(sheet.columns.length, 1) - 1);
  const lastRow = sheet.rows.length + 1;
  const range = `A1:${lastCol}${lastRow}`;
  const cols = sheet.columns
    .map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width}" customWidth="1"/>`)
    .join("");
  const header = `<row r="1">${sheet.columns
    .map((c, i) => cellXml(`${columnLetter(i)}1`, c.header, STYLE.header))
    .join("")}</row>`;
  const body = sheet.rows
    .map((row, r) => {
      const rowNum = r + 2;
      const cells = row
        .map((v, i) => cellXml(`${columnLetter(i)}${rowNum}`, v, sheet.columns[i]?.wrap && typeof v === "string" ? STYLE.wrap : STYLE.normal))
        .join("");
      return `<row r="${rowNum}">${cells}</row>`;
    })
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<dimension ref="${range}"/>` +
    `<sheetViews><sheetView workbookViewId="0"${selected ? ' tabSelected="1"' : ""}>` +
    `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>` +
    `<selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="15"/>` +
    `<cols>${cols}</cols>` +
    `<sheetData>${header}${body}</sheetData>` +
    (sheet.autoFilter !== false ? `<autoFilter ref="${range}"/>` : "") +
    `<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>` +
    `</worksheet>`
  );
}

const STYLES_XML =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
  `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
  `<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy hh:mm"/></numFmts>` +
  `<fonts count="2">` +
  `<font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font>` +
  `<font><b/><sz val="11"/><color rgb="FF05214B"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font>` +
  `</fonts>` +
  `<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="FFF3EBC8"/><bgColor indexed="64"/></patternFill></fill></fills>` +
  `<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>` +
  `<border><left/><right/><top/><bottom style="thin"><color rgb="FFA28E55"/></bottom><diagonal/></border></borders>` +
  `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
  `<cellXfs count="4">` +
  `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
  `<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>` +
  `<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
  `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>` +
  `</cellXfs>` +
  `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
  `</styleSheet>`;

function workbookParts(sheets: XlsxSheet[], title: string) {
  const quote = (name: string) => `'${name.replace(/'/g, "''")}'`;
  const definedNames = sheets
    .map((s, i) => {
      if (s.autoFilter === false) return "";
      const lastCol = columnLetter(Math.max(s.columns.length, 1) - 1);
      return `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">${xmlEscape(quote(s.name))}!$A$1:$${lastCol}$${s.rows.length + 1}</definedName>`;
    })
    .join("");
  const workbook =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<bookViews><workbookView xWindow="0" yWindow="0" windowWidth="20000" windowHeight="12000" activeTab="0"/></bookViews>` +
    `<sheets>${sheets.map((s, i) => `<sheet name="${xmlEscape(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>` +
    (definedNames ? `<definedNames>${definedNames}</definedNames>` : "") +
    `</workbook>`;
  const workbookRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    sheets
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
      )
      .join("") +
    `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `</Relationships>`;
  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    sheets
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
      )
      .join("") +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>` +
    `<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>` +
    `</Types>`;
  const rootRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>` +
    `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>` +
    `</Relationships>`;
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const core =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
    `<dc:title>${xmlEscape(title)}</dc:title><dc:creator>Kelly &amp; Kyara</dc:creator>` +
    `<dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>` +
    `</cp:coreProperties>`;
  const app =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>XV Kelly &amp; Kyara</Application></Properties>`;

  return [
    { name: "[Content_Types].xml", data: contentTypes },
    { name: "_rels/.rels", data: rootRels },
    { name: "docProps/core.xml", data: core },
    { name: "docProps/app.xml", data: app },
    { name: "xl/workbook.xml", data: workbook },
    { name: "xl/_rels/workbook.xml.rels", data: workbookRels },
    { name: "xl/styles.xml", data: STYLES_XML },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(s, i === 0) })),
  ];
}

// ---------- ZIP (store, no compression) ----------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((Math.max(date.getFullYear(), 1980) - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

export function zipStore(files: { name: string; data: Uint8Array }[]) {
  const { time, day } = dosDateTime(new Date());
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const crc = crc32(file.data);
    const size = file.data.length;

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true); // version needed
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(8, 0, true); // method: store
    local.setUint16(10, time, true);
    local.setUint16(12, day, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, size, true);
    local.setUint32(22, size, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);
    chunks.push(new Uint8Array(local.buffer), name, file.data);

    const dir = new DataView(new ArrayBuffer(46));
    dir.setUint32(0, 0x02014b50, true);
    dir.setUint16(4, 20, true); // version made by
    dir.setUint16(6, 20, true); // version needed
    dir.setUint16(8, 0x0800, true);
    dir.setUint16(10, 0, true);
    dir.setUint16(12, time, true);
    dir.setUint16(14, day, true);
    dir.setUint32(16, crc, true);
    dir.setUint32(20, size, true);
    dir.setUint32(24, size, true);
    dir.setUint16(28, name.length, true);
    dir.setUint16(30, 0, true); // extra
    dir.setUint16(32, 0, true); // comment
    dir.setUint16(34, 0, true); // disk
    dir.setUint16(36, 0, true); // internal attrs
    dir.setUint32(38, 0, true); // external attrs
    dir.setUint32(42, offset, true);
    central.push(new Uint8Array(dir.buffer), name);

    offset += 30 + name.length + size;
  }

  const centralSize = central.reduce((n, c) => n + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  const parts = [...chunks, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let pos = 0;
  for (const p of parts) {
    out.set(p, pos);
    pos += p.length;
  }
  return out;
}

/** Builds the .xlsx file (bytes) for the given sheets. */
export function buildXlsx(sheets: XlsxSheet[], title = "Libro") {
  return zipStore(workbookParts(sheets, title).map((f) => ({ name: f.name, data: encoder.encode(f.data) })));
}

export const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
