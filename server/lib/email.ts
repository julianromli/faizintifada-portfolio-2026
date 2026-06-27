import { Resend } from 'resend';

const DEFAULT_FROM = 'Faiz UI <noreply@faizintifada.com>';
const SUPPORT_EMAIL = 'faizintifada@gmail.com';

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error('RESEND_API_KEY is not set');
  return new Resend(key);
}

export interface FulfillmentInput {
  orderId: number;
  to: string;
  name?: string | null;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildHtml(name: string, installCommand: string, accessToken: string) {
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Your Faiz UI access</title></head>
  <body style="margin:0;background:#f7f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#141414;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f4;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e6e5e0;border-radius:20px;padding:32px;">
          <tr><td>
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;">Welcome to Faiz UI, ${esc(name)}.</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#555;">Payment received. Here is everything you need to start building.</p>

            <h2 style="margin:24px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#777;">1. Install</h2>
            <p style="margin:0 0 8px;font-size:14px;line-height:1.6;">Run this in your terminal:</p>
            <pre style="margin:0 0 20px;background:#141414;color:#f7f7f4;padding:14px 16px;border-radius:12px;font-size:13px;overflow:auto;"><code>${esc(installCommand)}</code></pre>

            <h2 style="margin:24px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#777;">2. Your access token</h2>
            <p style="margin:0 0 8px;font-size:14px;line-height:1.6;">Use this token when the scaffolder asks for it (it authorizes the private component registry):</p>
            <pre style="margin:0 0 20px;background:#f7f7f4;border:1px solid #e6e5e0;color:#141414;padding:14px 16px;border-radius:12px;font-size:13px;overflow:auto;"><code>${esc(accessToken)}</code></pre>

            <h2 style="margin:24px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#777;">3. Quick start</h2>
            <ol style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.7;color:#333;">
              <li>Run the install command above and follow the prompts.</li>
              <li>Paste your access token when asked.</li>
              <li><code>cd</code> into the new project, then <code>bun install</code>.</li>
              <li><code>bun run dev</code> and open <a href="http://localhost:3000" style="color:#141414;">http://localhost:3000</a>.</li>
              <li>Explore the live component catalog at <code>/ui-kit</code>.</li>
            </ol>

            <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#777;">Keep this email — it is your license + token. Questions? Reply or email <a href="mailto:${SUPPORT_EMAIL}" style="color:#141414;">${SUPPORT_EMAIL}</a>.</p>
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#999;">Faiz UI · faizintifada.com</p>
      </td></tr>
    </table>
  </body>
</html>`;
}

/**
 * Send the fulfillment email with install command, access token, and inline guideline.
 * Idempotency key keys on the order so webhook retries within 24h won't duplicate.
 * Returns the Resend message id, or throws on failure.
 */
export async function sendFulfillmentEmail({ orderId, to, name }: FulfillmentInput) {
  const installCommand =
    process.env.FAIZ_UI_INSTALL_COMMAND?.trim() || 'npx faiz-ui@latest init';
  const accessToken =
    process.env.FAIZ_UI_ACCESS_TOKEN?.trim() || 'TOKEN_NOT_CONFIGURED';
  const from = process.env.FAIZ_UI_FROM_EMAIL?.trim() || DEFAULT_FROM;
  const displayName = (name?.trim() || 'there') as string;

  const { data, error } = await getResend().emails.send(
    {
      from,
      to: [to],
      subject: 'Your Faiz UI access — install command + token',
      html: buildHtml(displayName, installCommand, accessToken),
    },
    { idempotencyKey: `faiz-ui-fulfillment/${orderId}` },
  );

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
  return data?.id ?? null;
}
