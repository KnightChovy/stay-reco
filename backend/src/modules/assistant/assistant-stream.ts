import { HttpException } from '@nestjs/common';
import type { AssistantReply } from '@stayreco/shared';
import type { Response } from 'express';
import type { TurnEvents } from './assistant.service';

/**
 * One assistant turn sent as server-sent events, so the customer watches the answer being written instead of
 * waiting for all of it (POST …/stream).
 *
 * The stream opens on the first event. Anything that fails before (the conversation is not theirs, the month's
 * budget is spent, the model is down) is thrown as usual and answered as a normal JSON error with its status; a
 * failure after is sent as an `error` event, since the status line is gone by then. Events:
 * `status` {text} what the assistant is doing, `delta` {text} the next piece of the answer, `reset` {} drop the text
 * so far, `done` the AssistantReply as POST …/messages returns it, `error` {status, code, message}.
 */
export async function streamTurn(
  res: Response,
  run: (events: TurnEvents) => Promise<AssistantReply>,
): Promise<void> {
  let open = false;
  const send = (event: string, data: unknown) => {
    if (!open) {
      open = true;
      res.status(201);
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();
    }
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const reply = await run({
      onStatus: (text) => send('status', { text }),
      onText: (text) => send('delta', { text }),
      onReset: () => send('reset', {}),
    });
    send('done', reply);
    res.end();
  } catch (err) {
    if (!open) throw err;
    const body = err instanceof HttpException ? err.getResponse() : null;
    send('error', {
      status: err instanceof HttpException ? err.getStatus() : 500,
      code:
        typeof body === 'object' && body && 'code' in body
          ? String(body.code)
          : 'INTERNAL_ERROR',
      message:
        typeof body === 'object' && body && 'message' in body
          ? String(body.message)
          : 'Internal server error',
    });
    res.end();
  }
}
