/**
 * Parser for "Importar desde Excel": the admin copies columns from Excel/Google Sheets and pastes them.
 * One row per member: Familia | Integrante | Tipo (opcional) | Teléfono (opcional).
 * Pure function shared by the preview (browser) and the server action (which re-parses the same text).
 */
import { LIMITS, cleanPhone, cleanText, normalizeText } from "@/lib/families";

export type ImportedMember = { name: string; isChild: boolean };
export type ImportedFamily = { key: string; name: string; phone: string; members: ImportedMember[] };
export type ImportWarning = { line: number; message: string };
export type ImportParseResult = {
  families: ImportedFamily[];
  warnings: ImportWarning[];
  memberCount: number;
  headerDetected: boolean;
};

export const MAX_IMPORT_FAMILIES = 400;

/** Same key for "Familia Pérez", "familia perez" and "FAMILIA  PÉREZ". */
export const familyKey = (name: string) => normalizeText(name);

const HEADER_FIRST = /^(familia|familias|invitacion|invitaciones|grupo|nombre de la familia)$/;
const HEADER_SECOND = /^(integrante|integrantes|nombre|nombres|invitado|invitados|persona|personas)$/;
const HEADER_TYPE = /^(tipo|tipo \(adulto\/nino\)|adulto\/nino|adulto o nino|edad|categoria)$/;
const HEADER_PHONE = /^(telefono|tel|tel\.|celular|cel|cel\.|whatsapp|movil|numero)$/;

/** Splits one line by the separator, honouring "quoted, cells" (as Excel/Sheets export them). */
function splitLine(line: string, sep: string) {
  const cells: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"' && cur.trim() === "") {
      quoted = true;
      cur = "";
    } else if (ch === sep) {
      cells.push(cur);
      cur = "";
    } else cur += ch;
  }
  cells.push(cur);
  return cells.map((c) => c.replace(/\s+/g, " ").trim());
}

/** Children are counted up to this age (an age typed in the "Tipo/Edad" column). */
export const CHILD_MAX_AGE = 11;

/**
 * Adulto/a, niño/niña, menor, n, an age ("7", "7 años") or a description ("Niño (5 años)",
 * "Adulto mayor", "Adolescente"). Unknown values count as adult (with a warning).
 */
function parseType(raw: string): { isChild: boolean; known: boolean } {
  const t = normalizeText(raw).replace(/[.()]/g, " ").replace(/\s+/g, " ").trim();
  if (!t) return { isChild: false, known: true };
  const age = t.match(/^(\d{1,3})( anos?| a)?$/);
  if (age) return { isChild: Number(age[1]) <= CHILD_MAX_AGE, known: true };
  if (/^(a|ad|adult|mayor|grande|joven|adolescente|senor|senora|sr|sra|papa|mama|abuel)/.test(t)) return { isChild: false, known: true };
  if (/^(n|nin[oa]s?|nino\/a|nino\/nina|menor|infant|bebe|kid|child|chic[oa])( |$|\/)/.test(t) || /^(nin[oa]|menor|bebe|infant)/.test(t)) {
    return { isChild: true, known: true };
  }
  return { isChild: false, known: false };
}

export function parseFamiliesImport(text: string): ImportParseResult {
  const lines = String(text ?? "").replace(/^﻿/, "").split(/\r\n|\n|\r/);
  const sep = lines.some((l) => l.includes("\t")) ? "\t" : lines.some((l) => l.includes(";")) ? ";" : ",";

  const families = new Map<string, ImportedFamily>();
  /** Display name of each family key (the first spelling typed). */
  const names = new Map<string, string>();
  const warnings: ImportWarning[] = [];
  let headerDetected = false;
  let lastKey: string | null = null;
  let firstRow = true;
  let memberCount = 0;
  let columns = { family: 0, member: 1, type: 2, phone: 3 };

  lines.forEach((rawLine, index) => {
    const line = index + 1;
    const cells = splitLine(rawLine, sep);
    if (cells.every((c) => !c)) return; // blank row

    if (firstRow) {
      firstRow = false;
      const find = (re: RegExp) => cells.findIndex((c) => re.test(normalizeText(c)));
      const familyCol = find(HEADER_FIRST);
      const memberCol = find(HEADER_SECOND);
      if (familyCol >= 0 || memberCol >= 0) {
        headerDetected = true;
        // Columns in any order (e.g. Integrante | Familia | Teléfono) are mapped by their header.
        const family = familyCol >= 0 ? familyCol : memberCol === 0 ? 1 : 0;
        const member = memberCol >= 0 ? memberCol : family === 0 ? 1 : 0;
        const used = new Set([family, member]);
        const type = find(HEADER_TYPE);
        const phone = find(HEADER_PHONE);
        const firstFree = (skip: number) => [0, 1, 2, 3, 4].find((i) => !used.has(i) && i !== skip) ?? -1;
        columns = {
          family,
          member,
          type: type >= 0 ? type : phone >= 0 ? -1 : firstFree(-1),
          phone: phone >= 0 ? phone : type >= 0 ? -1 : firstFree(firstFree(-1)),
        };
        return;
      }
    }
    const cell = (i: number) => (i >= 0 ? (cells[i] ?? "") : "");
    const familyCell = cell(columns.family);
    const memberCell = cell(columns.member);
    let typeCell = cell(columns.type);
    let phoneCell = cell(columns.phone);
    // A phone number typed in the "Tipo" column (3-column lists without type).
    if (!phoneCell && typeCell.replace(/\D/g, "").length >= 7) {
      phoneCell = typeCell;
      typeCell = "";
    }

    // A blank family cell continues the family above (common when the name is written only once).
    const key: string | null = familyCell ? familyKey(familyCell) : lastKey;
    if (familyCell && key && !names.has(key)) names.set(key, cleanText(familyCell, LIMITS.familyName));
    if (!key) {
      warnings.push({ line, message: `Fila ${line}: falta el nombre de la familia; se omitió.` });
      return;
    }
    const memberName = cleanText(memberCell, LIMITS.memberName);
    if (!memberName) {
      warnings.push({ line, message: `Fila ${line}: falta el nombre del integrante; se omitió.` });
      if (familyCell) lastKey = key;
      return;
    }

    let family = families.get(key);
    if (!family) {
      if (families.size >= MAX_IMPORT_FAMILIES) {
        warnings.push({ line, message: `Fila ${line}: se pueden importar hasta ${MAX_IMPORT_FAMILIES} familias a la vez.` });
        return;
      }
      family = { key, name: names.get(key) ?? cleanText(familyCell, LIMITS.familyName), phone: "", members: [] };
      families.set(key, family);
    }
    lastKey = key;

    const type = parseType(typeCell);
    if (!type.known) warnings.push({ line, message: `Fila ${line}: no se reconoció el tipo «${typeCell}»; se tomó como adulto.` });

    if (family.members.some((m) => normalizeText(m.name) === normalizeText(memberName))) {
      warnings.push({ line, message: `Fila ${line}: ${memberName} aparece dos veces en ${family.name}; se omitió la repetición.` });
      return;
    }
    if (family.members.length >= LIMITS.members) {
      warnings.push({ line, message: `Fila ${line}: ${family.name} ya tiene ${LIMITS.members} integrantes (máximo); se omitió.` });
      return;
    }
    family.members.push({ name: memberName, isChild: type.isChild });
    memberCount++;

    const phone = cleanPhone(phoneCell);
    if (phone && phone.replace(/\D/g, "").length >= 7 && !family.phone) family.phone = phone;
  });

  return { families: [...families.values()], warnings, memberCount, headerDetected };
}
