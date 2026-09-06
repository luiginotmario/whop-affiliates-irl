import { streamPitch } from "@/lib/clients/openrouter";
import { buildContext } from "@/lib/pitch";

/** Research plus generation runs past Vercel's default ceiling. Without this
 *  the platform kills the function before the model answers. */
export const maxDuration = 60;

type Event =
  | { type: "context"; place: unknown; context: unknown }
  | { type: "bullet"; index: number; bullet: unknown }
  | { type: "done"; pitch: unknown }
  | { type: "error"; error: string };

/** Newline-delimited JSON rather than a single response: the header renders as
 *  soon as the context lands, then each bullet as the model writes it. */
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

        const pitch = await streamPitch(context, (bullet, index) =>
          send({ type: "bullet", index, bullet }),
        );
        send({ type: "done", pitch });
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
      // Proxies that buffer would defeat the point of streaming.
      "X-Accel-Buffering": "no",
    },
  });
}
