import { buildContext, buildPitch } from "@/lib/pitch";

/** Research plus generation runs past Vercel's default ceiling. Without this
 *  the platform kills the function before the model answers. */
export const maxDuration = 60;

type Event =
  | { type: "context"; place: unknown; context: unknown }
  | { type: "done"; pitch: unknown }
  | { type: "error"; error: string };

/** Newline-delimited JSON in two beats: the context event lands as soon as the
 *  lookup, scrape and research finish, so the loader's ticks are real; the
 *  pitch follows. Both halves are cached, so a second view is instant. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ placeId: string }> },
) {
  const { placeId } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Event) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      try {
        const context = await buildContext(placeId);
        send({ type: "context", place: context.place, context });
        send({ type: "done", pitch: await buildPitch(placeId) });
      } catch (error) {
        send({
          type: "error",
          error:
            error instanceof Error
              ? error.message
              : "Couldn't build the pitch",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
