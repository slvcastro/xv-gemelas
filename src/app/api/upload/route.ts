import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { checkAdmin } from "@/app/actions/adminAuth";

/**
 * Issues short-lived tokens so the admin's browser can upload photos (and background music, under
 * "musica/") straight to Vercel Blob (no file-size limits from server actions / serverless bodies).
 */

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm"];
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await checkAdmin())) {
          throw new Error("No autorizado");
        }
        const music = pathname.startsWith("musica/");
        return {
          // HEIC is excluded: browsers cannot display it (iOS converts to JPEG when it is not accepted).
          allowedContentTypes: music ? AUDIO_TYPES : IMAGE_TYPES,
          maximumSizeInBytes: (music ? 20 : 25) * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
