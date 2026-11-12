import { publishFailed } from './social-publisher';

/** How long we wait on Meta before giving up. A publishing job must not hang on one slow page. */
const TIMEOUT_MS = 15_000;

/** The shape Meta returns when it refuses something. */
interface GraphError {
  error?: { message?: string; type?: string; code?: number };
}

/**
 * One call to the Meta Graph API, which both the Facebook and the Instagram publisher go through.
 *
 * The access token goes in the POST body rather than the query string: a URL ends up in logs, proxies and error
 * messages, and a page token is a credential that can post as the hotel for months.
 *
 * `platform` is only there for the error message. Meta's own message is passed through because it is usually
 * actionable - an expired token, a page the app was never granted, a caption too long - and a generic "publishing
 * failed" would send the owner to us instead of to the fix.
 */
export async function graphCall<T>(
  platform: string,
  version: string,
  path: string,
  params: Record<string, string>,
  method: 'GET' | 'POST' = 'POST',
): Promise<T> {
  const base = `https://graph.facebook.com/${version}/${path}`;
  const body = new URLSearchParams(params);
  const url = method === 'GET' ? `${base}?${body.toString()}` : base;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      ...(method === 'POST' && { body }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    // A timeout or a DNS failure is the same thing to the caller as a refusal: the post did not go out.
    throw publishFailed(
      platform,
      err instanceof Error ? err.message : 'unreachable',
    );
  }

  const text = await response.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }

  if (!response.ok) {
    const message =
      (json as GraphError | undefined)?.error?.message ??
      `HTTP ${response.status}`;
    throw publishFailed(platform, message);
  }
  if (json === undefined) {
    throw publishFailed(platform, 'answered with something that is not JSON');
  }
  return json as T;
}
