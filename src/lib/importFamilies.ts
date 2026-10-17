/**
 * Parser for "Importar desde Excel": the admin copies columns from Excel/Google Sheets and pastes them.
 * One row per member: Familia | Integrante | Tipo (opcional) | Teléfono (opcional).
 * Without names, a row can say how many instead: an amount in «Integrante» («2 adultos y 1 niño», «3»,
 * «acompañante», «Juan Pérez y acompañante»), only the «Tipo» («Niño»), or «Adultos» / «Niños» columns
 * with the family's totals (the people named in its rows count toward them). Those people are added
 * without a name (the family can write it on their invitation).
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
const HEADER_TYPE = /^(tipo|tipo \(adulto ?\/ ?nino\)|adulto ?\/ ?nino|adulto o nino|edad|categoria)$/;
const HEADER_PHONE = /^(telefono|tel|tel\.|celular|cel|cel\.|whatsapp|movil|numero)$/;
const HEADER_ADULTS = /^((no\.?|numero|cantidad|num\.?|#) ?(de )?)?adultos?$/;
const HEADER_CHILDREN = /^((no\.?|numero|cantidad|num\.?|#) ?(de )?)?(ninos?|ninas?|ninos\/as|menores)$/;
/** How many people in all («No. de pases», «Boletos», «Total de invitados»), adults unless said otherwise. */
const HEADER_TOTAL = /^((no\.?|numero|cantidad|num\.?|#|total) ?(de )?)?(pases?|boletos?|lugares?)$|^((no\.?|numero|cantidad|num\.?|#|total) ?(de )?)(invitados|personas)$|^(total|cantidad)$/;

/** Most people one row may add (a typo like «200 adultos» must not create a crowd). */
const MAX_PER_ROW = 30;

const NUMBER_WORDS: Record<string, number> = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10 };
const NUMBER = `\\d{1,3}|${Object.keys(NUMBER_WORDS).join("|")}`;
const AMOUNT_PART = new RegExp(
  `^(${NUMBER})?\\s*(adultos?(?: mayor(?:es)?)?|ninos?|ninas?|bebes?|menor(?:es)?|acompanantes?|personas?|invitados?|pases?|boletos?|lugares?)?$`
);
/** Between amounts: «y», «e», «,», «+», «/», « - », «más», or nothing before the next number («2 adultos 1 niño»). */
const AMOUNT_SEPARATOR = new RegExp(`\\s*(?:,|\\+|/|\\s-\\s|\\by\\b|\\be\\b|\\bmas\\b)\\s*|\\s+(?=(?:${NUMBER})\\s*[a-z])`);

/**
 * An amount written instead of a name: «3», «2 adultos», «1 niño», «2 adultos y 1 niño», «2 adultos 1 niño»,
 * «1 adulto + 2 niños», «un menor», «acompañante», «2 acompañantes», «+1», «4 pases». A bare number
 * counts as the row's type. Also the panel's own labels for someone without a name («Adulto 2», «Niño 1
 * (sin nombre)»), so its Excel can be pasted back. Null when the text is a name (a girl called «Nina» is
 * not «niña»: a word alone needs its «ñ»).
 */
export function parseAmount(raw: string, childByDefault = false): { adults: number; children: number } | null {
  let t = normalizeText(raw).replace(/[.]/g, " ").replace(/\s+/g, " ").trim();
  const unnamedMark = /\(?sin nombre\)?$/.test(t);
  t = t.replace(/\(?sin nombre\)?$/, "").trim();
  if (!t) return null;
  let adults = 0;
  let children = 0;
  // Every part must be an amount: a name anywhere means the whole text is a name.
  const parts = t.split(AMOUNT_SEPARATOR).filter(Boolean);
  for (const part of parts) {
    // A label: «Adulto 2», «Acompañante 1», «Niño 3» is one person of that kind.
    const label = part.match(/^(adulto|nino|nina|acompanante|invitado|persona)s? \d{1,2}$/);
    if (label) {
      if (/^nin/.test(label[1])) children++;
      else adults++;
      continue;
    }
    const m = part.match(AMOUNT_PART);
    if (!m || (!m[1] && !m[2])) return null;
    const kind = m[2] ?? "";
    // A word with no number: only unambiguous ones («acompañante», «adulto», «menor», «bebé», «niño» with ñ).
    if (!m[1] && !unnamedMark && !/^(acompanantes?|adultos?( mayor(es)?)?|menor|bebe)$/.test(kind) && !(/^nin/.test(kind) && /ñ/i.test(raw))) return null;
    const n = m[1] ? (NUMBER_WORDS[m[1]] ?? Number(m[1])) : 1;
    if (/^(nin|menor|bebe)/.test(kind)) children += n;
    else if (/^(adult|acompan)/.test(kind)) adults += n;
    else if (childByDefault) children += n;
    else adults += n;
  }
  return adults + children > 0 ? { adults, children } : null;
}

/**
 * «Juan Pérez y acompañante», «Ana López + 2», «Ana y dos niños», «Luis con 2 adultos y 1 niño»: the name
 * and who comes with them (companions are adults unless the text says children).
 */
export function splitCompanions(raw: string): { name: string; adults: number; children: number } | null {
  const m = raw.match(/^(.*\S)\s*(?:\+|\by\b|\bcon\b)\s*(\d{1,2}|un|una|dos|tres)?\s*(acompa[ñn]antes?|invitad[oa]s?)?\s*$/i);
  if (m && (m[2] || m[3]) && !/^\d/.test(m[1])) {
    const key = (m[2] ?? "").toLowerCase();
    const n = m[2] ? (NUMBER_WORDS[key] ?? Number(key)) : 1;
    return n > 0 ? { name: m[1].trim(), adults: n, children: 0 } : null;
  }
  // The first «y» / «+» / «con» after which everything is an amount («Juan y Ana y 2 niños» keeps «Juan y Ana»).
  for (const sep of raw.matchAll(/\s*(?:\+|\by\b|\bcon\b)\s*/gi)) {
    const name = raw.slice(0, sep.index).trim();
    const amount = parseAmount(raw.slice(sep.index + sep[0].length));
    if (name && !/^\d/.test(name) && amount) return { name, ...amount };
  }
  return null;
}

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
  /** Totals from the «Adultos» / «Niños» columns (the largest written in any row of the family). */
  const totals = new Map<string, { adults: number; children: number; people: number; line: number }>();
  /** First phone written for each family, in any of its rows. */
  const phones = new Map<string, string>();
  /** Line where each family first appears, and families already warned about (to warn once). */
  const firstLines = new Map<string, number>();
  const warned = new Set<string>();
  /** Who came with each named person («Juan y acompañante», «Ana y 2 niños»), per family. */
  const companions = new Map<string, Map<string, { adults: number; children: number }>>();
  let columns = { family: 0, member: 1, type: 2, phone: 3, adults: -1, children: -1, total: -1 };

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
        const adults = find(HEADER_ADULTS);
        const children = find(HEADER_CHILDREN);
        const total = find(HEADER_TOTAL);
        const type = find(HEADER_TYPE);
        const phone = find(HEADER_PHONE);
        const counts = adults >= 0 || children >= 0 || total >= 0;
        // «Nombre | Adultos | Niños»: with counts and no «Familia» column, the name is the invitation's.
        const countsOnly = counts && familyCol < 0;
        const family = familyCol >= 0 ? familyCol : countsOnly ? memberCol : memberCol === 0 ? 1 : 0;
        // With «Adultos» / «Niños» columns the names are optional: no «Integrante» column is assumed.
        // Without an «Integrante» header, the first column that is not the family, phone or type.
        const member = countsOnly
          ? -1
          : memberCol >= 0
            ? memberCol
            : counts
              ? -1
              : ([0, 1, 2, 3, 4, 5].find((i) => i !== family && i !== phone && i !== type) ?? -1);
        const used = new Set([family, member, adults, children, total]);
        const firstFree = (skip: number) => [0, 1, 2, 3, 4, 5].find((i) => !used.has(i) && i !== skip) ?? -1;
        columns = {
          family,
          member,
          type: type >= 0 ? type : phone >= 0 || counts ? -1 : firstFree(-1),
          phone: phone >= 0 ? phone : type >= 0 || counts ? -1 : firstFree(firstFree(-1)),
          adults,
          children,
          total,
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
    if (familyCell && key && !names.has(key)) {
      names.set(key, cleanText(familyCell, LIMITS.familyName));
      firstLines.set(key, line);
    }
    if (!key) {
      warnings.push({ line, message: `Fila ${line}: falta el nombre de la familia; se omitió.` });
      return;
    }
    const phone = cleanPhone(phoneCell);
    if (phone.replace(/\D/g, "").length >= 7 && !phones.has(key)) phones.set(key, phone);

    const type = parseType(typeCell);
    const memberName = cleanText(memberCell, LIMITS.memberName);
    // Who this row adds: a person by name and/or people without a name (an amount, «y acompañante» or
    // the type alone). The «Adultos» / «Niños» columns are the family's totals, completed at the end.
    const countCell = (i: number) => {
      const raw = cell(i).replace(/\s+/g, "");
      return /^\d{1,3}$/.test(raw) ? Number(raw) : 0;
    };
    // Next to «Adultos» / «Niños» columns, a bare number in «Integrantes» is the family's total (as in the
    // panel's own Excel), not more people: it only fills in the adults the columns leave out.
    const bareTotal = (columns.adults >= 0 || columns.children >= 0) && /^\d{1,3}$/.test(memberName) ? Number(memberName) : null;
    const amount = memberName && bareTotal === null ? parseAmount(memberName, type.isChild) : null;
    const withCompanions = memberName && bareTotal === null && !amount ? splitCompanions(memberName) : null;
    const totalChildren = countCell(columns.children);
    const totalAdults = Math.max(countCell(columns.adults), (bareTotal ?? 0) - totalChildren);
    const totalPeople = countCell(columns.total);
    let unnamedAdults = (amount?.adults ?? 0) + (withCompanions?.adults ?? 0);
    let unnamedChildren = (amount?.children ?? 0) + (withCompanions?.children ?? 0);
    const named = amount || bareTotal !== null ? "" : (withCompanions?.name ?? memberName);
    // Without a type, a name in a row that says «0» adults and some children is a child.
    const namedIsChild = typeCell ? type.isChild : cell(columns.adults).trim() === "0" && totalChildren > 0;
    if (!named && unnamedAdults + unnamedChildren === 0 && typeCell && type.known) {
      if (type.isChild) unnamedChildren = 1;
      else unnamedAdults = 1;
    }
    if (!named && unnamedAdults + unnamedChildren + totalAdults + totalChildren + totalPeople === 0) {
      if (familyCell) lastKey = key;
      // A row with only the family's name (or zeros), in a list with «Adultos» / «Niños» columns: nothing to add.
      if (columns.adults < 0 && columns.children < 0 && columns.total < 0) {
        warnings.push({
          line,
          message: `Fila ${line}: falta el integrante (su nombre o cuántos, por ejemplo «2 adultos y 1 niño»); se omitió.`,
        });
      }
      return;
    }
    const many = Math.max(unnamedAdults + unnamedChildren, totalAdults + totalChildren, totalPeople);
    if (many > MAX_PER_ROW) {
      warnings.push({ line, message: `Fila ${line}: ${many} personas en una sola fila parecen demasiadas; se omitió.` });
      warned.add(key);
      if (familyCell) lastKey = key;
      return;
    }

    let family = families.get(key);
    if (!family) {
      if (families.size >= MAX_IMPORT_FAMILIES) {
        warnings.push({ line, message: `Fila ${line}: se pueden importar hasta ${MAX_IMPORT_FAMILIES} familias a la vez.` });
        warned.add(key);
        return;
      }
      family = { key, name: names.get(key) ?? cleanText(familyCell, LIMITS.familyName), phone: "", members: [] };
      families.set(key, family);
    }
    lastKey = key;

    if (totalAdults + totalChildren + totalPeople > 0) {
      const t = totals.get(key);
      totals.set(key, {
        adults: Math.max(t?.adults ?? 0, totalAdults),
        children: Math.max(t?.children ?? 0, totalChildren),
        people: Math.max(t?.people ?? 0, totalPeople),
        line: t?.line ?? line,
      });
    }

    if (named && !type.known) warnings.push({ line, message: `Fila ${line}: no se reconoció el tipo «${typeCell}»; se tomó como adulto.` });
    if (named && /\d/.test(named)) {
      warnings.push({
        line,
        message: `Fila ${line}: «${named}» se tomó como el nombre de una persona; si es una cantidad, escríbela como «2 adultos y 1 niño».`,
      });
    }

    const toAdd: ImportedMember[] = [];
    if (named) {
      const nameKey = normalizeText(named);
      const brought = companions.get(key) ?? new Map<string, { adults: number; children: number }>();
      companions.set(key, brought);
      if (family.members.some((m) => m.name && normalizeText(m.name) === nameKey)) {
        // Repeated: only companions not added yet (the same «Juan y acompañante» twice adds one).
        const before = brought.get(nameKey) ?? { adults: 0, children: 0 };
        unnamedAdults = Math.max(0, unnamedAdults - before.adults);
        unnamedChildren = Math.max(0, unnamedChildren - before.children);
        brought.set(nameKey, { adults: before.adults + unnamedAdults, children: before.children + unnamedChildren });
        const extra = unnamedAdults + unnamedChildren;
        warnings.push({
          line,
          message: `Fila ${line}: ${named} aparece dos veces en ${family.name}; ${
            extra === 0 ? "se omitió la repetición" : extra === 1 ? "solo se agregó su acompañante" : `solo se agregaron sus ${extra} acompañantes`
          }.`,
        });
      } else {
        toAdd.push({ name: named, isChild: namedIsChild });
        brought.set(nameKey, { adults: unnamedAdults, children: unnamedChildren });
      }
    }
    for (let i = 0; i < unnamedAdults; i++) toAdd.push({ name: "", isChild: false });
    for (let i = 0; i < unnamedChildren; i++) toAdd.push({ name: "", isChild: true });

    const room = LIMITS.members - family.members.length;
    if (toAdd.length > room) {
      warnings.push({
        line,
        message: `Fila ${line}: ${family.name} llegaría a más de ${LIMITS.members} integrantes (máximo); ${room > 0 ? `solo se agregaron ${room}` : "se omitió"}.`,
      });
    }
    family.members.push(...toAdd.slice(0, Math.max(0, room)));
  });

  for (const family of families.values()) {
    family.phone = phones.get(family.key) ?? "";
    // «Adultos» / «Niños» totals: add people without a name up to them (adults after the last adult).
    const t = totals.get(family.key);
    if (!t) continue;
    const missingChildren = Math.max(0, t.children - family.members.filter((m) => m.isChild).length);
    // A «Pases» total that is still not reached is completed with adults.
    const missingAdults = Math.max(
      t.adults - family.members.filter((m) => !m.isChild).length,
      t.people - family.members.length - missingChildren,
      0
    );
    const room = LIMITS.members - family.members.length;
    if (missingAdults + missingChildren > room) {
      warnings.push({
        line: t.line,
        message: `Fila ${t.line}: ${family.name} llegaría a más de ${LIMITS.members} integrantes (máximo); ${room > 0 ? `solo se agregaron ${room}` : "no se agregaron más"}.`,
      });
    }
    const adults = Math.min(missingAdults, room);
    const children = Math.min(missingChildren, room - adults);
    const lastAdult = family.members.findLastIndex((m) => !m.isChild);
    family.members.splice(lastAdult + 1, 0, ...Array.from({ length: adults }, () => ({ name: "", isChild: false })));
    family.members.push(...Array.from({ length: children }, () => ({ name: "", isChild: true })));
  }
  const list = [...families.values()].filter((f) => f.members.length > 0);
  // Lists with «Adultos» / «Niños» / «Pases» columns skip rows without amounts quietly: say which families were left out.
  if (columns.adults >= 0 || columns.children >= 0 || columns.total >= 0) {
    for (const [key, line] of firstLines) {
      if (!warned.has(key) && !list.some((f) => f.key === key)) {
        warnings.push({ line, message: `Fila ${line}: «${names.get(key)}» no tiene integrantes ni cantidades; se omitió.` });
      }
    }
    warnings.sort((a, b) => a.line - b.line);
  }
  const memberCount = list.reduce((n, f) => n + f.members.length, 0);

  return { families: list, warnings, memberCount, headerDetected };
}
