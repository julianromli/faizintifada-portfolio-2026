import { render } from '@react-email/render';
import { Resend } from 'resend';
import { FulfillmentEmail } from '../../emails/fulfillment.tsx';

const DEFAULT_FROM = 'Faiz UI <noreply@faizintifada.com>';
const SUPPORT_EMAIL = 'faizintifada@gmail.com';
const DEMO_URL = 'https://ui.faizintifada.com';

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

/**
 * Send the fulfillment email with install command, access token, and quick start.
 * The template lives in emails/fulfillment.tsx (react-email) and is rendered to
 * HTML + plain text at send time. Idempotency key keys on the order so webhook
 * retries within 24h won't duplicate. Returns the Resend message id, or throws.
 */
export async function sendFulfillmentEmail({ orderId, to, name }: FulfillmentInput) {
  const installCommand =
    process.env.FAIZ_UI_INSTALL_COMMAND?.trim() || 'npx faiz-ui@latest init';
  const accessToken =
    process.env.FAIZ_UI_ACCESS_TOKEN?.trim() || 'TOKEN_NOT_CONFIGURED';
  const from = process.env.FAIZ_UI_FROM_EMAIL?.trim() || DEFAULT_FROM;
  const displayName = (name?.trim() || 'there') as string;

  const element = FulfillmentEmail({
    name: displayName,
    installCommand,
    accessToken,
    demoUrl: DEMO_URL,
    supportEmail: SUPPORT_EMAIL,
  });
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  const { data, error } = await getResend().emails.send(
    {
      from,
      to: [to],
      subject: 'Your Faiz UI access — install command + token',
      html,
      text,
    },
    { idempotencyKey: `faiz-ui-fulfillment/${orderId}` },
  );

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
  return data?.id ?? null;
}
