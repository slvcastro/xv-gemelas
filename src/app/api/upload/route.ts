import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { checkAdmin } from "@/app/actions/adminAuth";

/**
 * Issues short-lived tokens so the admin's browser can upload photos straight to
 * Vercel Blob (no file-size limits from server actions / serverless bodies).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await checkAdmin())) {
          throw new Error("No autorizado");
        }
        return {
          // HEIC is excluded: browsers cannot display it (iOS converts to JPEG when it is not accepted).
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
          maximumSizeInBytes: 25 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
