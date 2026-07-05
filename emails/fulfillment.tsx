import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export interface FulfillmentEmailProps {
  name: string;
  installCommand: string;
  accessToken: string;
  demoUrl?: string;
  supportEmail?: string;
}

// --- design tokens (mirrors src/index.css light theme) ---
const canvas = '#f7f7f4';
const card = '#ffffff';
const border = '#e6e5e0';
const foreground = '#262510';
const strong = '#141414';
const muted = '#7a7974';
const accent = '#f54e00';
const footerMuted = '#999999';

const fontSans =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const fontMono =
  "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const bodyStyle = {
  margin: 0,
  backgroundColor: canvas,
  fontFamily: fontSans,
  color: foreground,
};

const containerStyle = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 16px',
};

const cardStyle = {
  backgroundColor: card,
  border: `1px solid ${border}`,
  borderRadius: '20px',
  padding: '32px',
};

const eyebrowStyle = {
  margin: '0 0 8px',
  fontSize: '11px',
  fontWeight: 600 as const,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: accent,
};

const h1Style = {
  margin: '0 0 8px',
  fontSize: '24px',
  lineHeight: '1.25',
  fontWeight: 600 as const,
  letterSpacing: '-0.02em',
  color: strong,
};

const leadStyle = {
  margin: '0 0 8px',
  fontSize: '15px',
  lineHeight: '1.6',
  color: muted,
};

const sectionLabelStyle = {
  margin: '0 0 8px',
  fontSize: '11px',
  fontWeight: 600 as const,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: muted,
};

const bodyTextStyle = {
  margin: '0 0 10px',
  fontSize: '14px',
  lineHeight: '1.6',
  color: foreground,
};

const hintStyle = {
  margin: '10px 0 0',
  fontSize: '13px',
  lineHeight: '1.6',
  color: muted,
};

const codeBlockStyle = {
  margin: '0',
  backgroundColor: strong,
  color: canvas,
  padding: '14px 16px',
  borderRadius: '12px',
  fontSize: '13px',
  fontFamily: fontMono,
  wordBreak: 'break-all' as const,
};

const tokenBoxStyle = {
  margin: '0',
  backgroundColor: canvas,
  border: `1px solid ${border}`,
  color: strong,
  padding: '14px 16px',
  borderRadius: '12px',
  fontSize: '13px',
  fontFamily: fontMono,
  wordBreak: 'break-all' as const,
};

const buttonStyle = {
  backgroundColor: strong,
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600 as const,
  textDecoration: 'none',
  padding: '13px 22px',
  borderRadius: '9999px',
  display: 'inline-block',
  boxSizing: 'border-box' as const,
};

const dividerStyle = {
  border: 'none',
  borderTop: `1px solid ${border}`,
  margin: '28px 0',
};

const footnoteStyle = {
  margin: '0',
  fontSize: '13px',
  lineHeight: '1.6',
  color: muted,
};

const footerStyle = {
  margin: '16px 0 0',
  fontSize: '12px',
  color: footerMuted,
  textAlign: 'center' as const,
};

const linkStyle = { color: strong, textDecoration: 'underline' };

const stepStyle = {
  margin: '0 0 8px',
  fontSize: '14px',
  lineHeight: '1.6',
  color: foreground,
};

const inlineCode = {
  fontFamily: fontMono,
  fontSize: '13px',
  backgroundColor: canvas,
  border: `1px solid ${border}`,
  borderRadius: '5px',
  padding: '1px 5px',
  color: strong,
};

export function FulfillmentEmail({
  name,
  installCommand,
  accessToken,
  demoUrl = 'https://ui.faizintifada.com',
  supportEmail = 'faizintifada@gmail.com',
}: FulfillmentEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={bodyStyle}>
        <Preview>Your Faiz UI access — install command, token, and quick start</Preview>
        <Container style={containerStyle}>
          <Section style={cardStyle}>
            <Text style={eyebrowStyle}>Faiz UI</Text>
            <Heading as="h1" style={h1Style}>
              Welcome to Faiz UI, {name}.
            </Heading>
            <Text style={leadStyle}>
              Payment received. Everything you need to start shipping on-brand UI is right
              here.
            </Text>

            <Hr style={dividerStyle} />

            <Text style={sectionLabelStyle}>1 · Install</Text>
            <Text style={bodyTextStyle}>Run this in your terminal:</Text>
            <Text style={codeBlockStyle}>{installCommand}</Text>
            <Text style={hintStyle}>
              When it asks which framework, choose <strong>TanStack Start</strong> or{' '}
              <strong>Next.js</strong> — both ship the same components, semantic tokens, and{' '}
              <span style={inlineCode}>/ui-kit</span> catalog.
            </Text>

            <Hr style={dividerStyle} />

            <Text style={sectionLabelStyle}>2 · Your access token</Text>
            <Text style={bodyTextStyle}>
              Paste this when the scaffolder asks for it. It authorizes the private component
              registry:
            </Text>
            <Text style={tokenBoxStyle}>{accessToken}</Text>

            <Hr style={dividerStyle} />

            <Text style={sectionLabelStyle}>3 · Quick start</Text>
            <ol style={{ margin: '0 0 4px', paddingLeft: '20px' }}>
              <li style={stepStyle}>Run the install command above and pick your framework.</li>
              <li style={stepStyle}>Paste your access token when prompted.</li>
              <li style={stepStyle}>
                <span style={inlineCode}>cd</span> into the new project, then{' '}
                <span style={inlineCode}>bun install</span>.
              </li>
              <li style={stepStyle}>
                <span style={inlineCode}>bun run dev</span> and open{' '}
                <span style={inlineCode}>localhost:3000</span>.
              </li>
              <li style={stepStyle}>
                Explore the live component catalog at{' '}
                <span style={inlineCode}>/ui-kit</span>.
              </li>
            </ol>

            <Section style={{ marginTop: '24px' }}>
              <Button href={demoUrl} style={buttonStyle}>
                Open the live demo →
              </Button>
            </Section>

            <Hr style={dividerStyle} />

            <Text style={footnoteStyle}>
              Keep this email — it is your license + token. Questions? Just reply, or email{' '}
              <Link href={`mailto:${supportEmail}`} style={linkStyle}>
                {supportEmail}
              </Link>
              .
            </Text>
          </Section>
          <Text style={footerStyle}>Faiz UI · faizintifada.com</Text>
        </Container>
      </Body>
    </Html>
  );
}

FulfillmentEmail.PreviewProps = {
  name: 'Nizam',
  installCommand: 'bun create faiz-ui@latest',
  accessToken: 'faizui_sk_live_8f3c1a9b2d4e6f7089abcdef01234567',
  demoUrl: 'https://ui.faizintifada.com',
  supportEmail: 'faizintifada@gmail.com',
} satisfies FulfillmentEmailProps;

export default FulfillmentEmail;
