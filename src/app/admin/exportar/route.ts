import { NextResponse, type NextRequest } from "next/server";
import { checkAdmin } from "@/app/actions/adminAuth";
import { buildGuestWorkbook, buildImportTemplate } from "@/lib/exportFamilies";
import { toDateInputValue } from "@/lib/format";
import { getSiteUrl } from "@/lib/site";
import { XLSX_CONTENT_TYPE, buildXlsx } from "@/lib/xlsx";

/**
 * GET /admin/exportar → Excel with the guest list (admin only).
 * GET /admin/exportar?plantilla=1 → empty template for "Importar desde Excel".
 * Without a session it sends the browser to the login.
 */
export async function GET(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.redirect(new URL("/admin", request.url), 303);
  }

  const template = request.nextUrl.searchParams.has("plantilla");
  try {
    const bytes = template
      ? buildXlsx(buildImportTemplate(), "Plantilla de invitados")
      : buildXlsx(await buildGuestWorkbook(await getSiteUrl()), "Invitados XV Kelly & Kyara");
    const filename = template
      ? "plantilla-invitados-xv.xlsx"
      : `invitados-xv-kelly-kyara-${toDateInputValue(new Date())}.xlsx`;

    return new Response(bytes as BodyInit, {
      headers: {
        "Content-Type": XLSX_CONTENT_TYPE,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error al generar el Excel:", error);
    return new Response("No se pudo generar el archivo. Revisa tu conexión e intenta de nuevo.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
