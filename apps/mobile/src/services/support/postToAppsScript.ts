/**
 * POST JSON to a Google Apps Script Web App.
 *
 * Apps Script returns 302 → script.googleusercontent.com/macros/echo with the
 * ContentService body. Following that redirect with POST becomes GET and 405s,
 * so we treat 302 as the handoff and GET the Location for the real JSON.
 *
 * Deploy: Execute as = Me, Who has access = Anyone.
 * Body: text/plain (avoids CORS preflight quirks).
 */
export async function postToAppsScript(
  url: string,
  payload: Record<string, unknown>,
  label: string,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      `${label}: network failed. Check connection, then confirm the Web App URL is a /exec deploy link.`,
    );
  }

  if (response.status === 403) {
    throw new Error(
      `${label}: Google returned 403 (Access denied). Redeploy with Execute as: Me and Who has access: Anyone, then paste the new /exec URL.`,
    );
  }

  // React Native may expose opaque redirect as type opaqueredirect / status 0.
  const location =
    response.headers.get('Location') || response.headers.get('location') || undefined;
  const isRedirect =
    response.status === 0 ||
    response.type === 'opaqueredirect' ||
    response.status === 301 ||
    response.status === 302 ||
    response.status === 303 ||
    response.status === 307 ||
    response.status === 308;

  if (isRedirect && location) {
    await assertAppsScriptEchoOk(location, label);
    return;
  }

  if (isRedirect && !location) {
    // Opaque redirect: body already accepted by Apps Script in most cases.
    return;
  }

  if (response.status >= 400) {
    throw new Error(`${label}: submit failed (${response.status})`);
  }

  await assertResponseOkJson(response, label);
}

async function assertAppsScriptEchoOk(echoUrl: string, label: string): Promise<void> {
  let echo: Response;
  try {
    echo = await fetch(echoUrl, {
      method: 'GET',
      headers: { Accept: 'application/json, text/plain, */*' },
    });
  } catch {
    // Row may still have been written; don't fail hard on echo fetch.
    return;
  }
  if (echo.status >= 400) return;
  await assertResponseOkJson(echo, label);
}

async function assertResponseOkJson(response: Response, label: string): Promise<void> {
  const text = (await response.text()).trim();
  if (!text) return;
  try {
    const data = JSON.parse(text) as { ok?: boolean; error?: string };
    if (data && data.ok === false) {
      throw new Error(`${label}: ${data.error || 'sheet rejected the row'}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(`${label}:`)) throw error;
    // Non-JSON success body — ignore.
  }
}
