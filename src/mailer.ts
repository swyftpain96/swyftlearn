import net from 'node:net';
import tls from 'node:tls';
import dns from 'node:dns/promises';
import fs from 'node:fs';
import path from 'node:path';

export interface EmailOptions {
  from: string;
  fromName?: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
}

export interface MailDeliveryResult {
  delivered: boolean;
  method: 'smtp' | 'resend' | 'direct-mx' | 'none';
  message: string;
  error?: string;
}

/**
 * Ensures .env is actively loaded into process.env if not already present.
 */
function ensureEnvLoaded() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    try {
      if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile();
      } else {
        // Fallback simple parser if running on an older runtime
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          const content = fs.readFileSync(envPath, 'utf-8');
          for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx !== -1) {
              const key = trimmed.slice(0, eqIdx).trim();
              let val = trimmed.slice(eqIdx + 1).trim();
              if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
              }
              if (!process.env[key]) {
                process.env[key] = val;
              }
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Low-level SMTP client using Node's net and tls modules.
 * Implements standard RFC 5321 conversation.
 */
function sendSmtpRaw({
  host,
  port,
  secure,
  user,
  pass,
  from,
  to,
  data,
  timeoutMs = 15000,
}: {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
  to: string;
  data: string;
  timeoutMs?: number;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    let socket: net.Socket | tls.TLSSocket;
    let timer: NodeJS.Timeout;

    const cleanup = () => {
      clearTimeout(timer);
      if (socket && !socket.destroyed) {
        socket.destroy();
      }
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error(`SMTP connection timed out after ${timeoutMs}ms connecting to ${host}:${port}`));
    }, timeoutMs);

    let buffer = '';
    const readResponse = (): Promise<{ code: number; text: string }> => {
      return new Promise((res, rej) => {
        const onData = (chunk: Buffer) => {
          buffer += chunk.toString('utf-8');
          const lines = buffer.split('\r\n');
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            // Multi-line response completes when 4th character is a space
            if (line && line.length >= 4 && line[3] === ' ') {
              const code = parseInt(line.substring(0, 3), 10);
              buffer = lines.slice(i + 1).join('\r\n');
              socket.off('data', onData);
              socket.off('error', onError);
              return res({ code, text: line });
            }
          }
        };

        const onError = (err: Error) => {
          socket.off('data', onData);
          rej(err);
        };

        socket.on('data', onData);
        socket.once('error', onError);
      });
    };

    const sendCommand = async (cmd: string, expectedCode: number | number[]) => {
      socket.write(cmd + '\r\n');
      const resp = await readResponse();
      const expected = Array.isArray(expectedCode) ? expectedCode : [expectedCode];
      if (!expected.includes(resp.code)) {
        throw new Error(`SMTP command failed [${cmd.substring(0, 15)}...]: expected ${expected.join('/')}, got ${resp.code} (${resp.text})`);
      }
      return resp;
    };

    const runConversation = async () => {
      try {
        // 1. Initial banner
        const banner = await readResponse();
        if (banner.code !== 220) {
          throw new Error(`Invalid greeting: ${banner.code} ${banner.text}`);
        }

        // 2. EHLO
        await sendCommand('EHLO swyftpain.dev', 250);

        // 3. STARTTLS if unencrypted on port 587 or 25
        if (!secure && port === 587) {
          await sendCommand('STARTTLS', 220);
          socket = tls.connect({
            socket: socket as net.Socket,
            rejectUnauthorized: false,
          });
          await new Promise<void>((res, rej) => {
            socket.once('secureConnect', () => res());
            socket.once('error', (e) => rej(e));
          });
          await sendCommand('EHLO swyftpain.dev', 250);
        }

        // 4. Authenticate if credentials provided
        if (user && pass) {
          await sendCommand('AUTH LOGIN', 334);
          await sendCommand(Buffer.from(user).toString('base64'), 334);
          await sendCommand(Buffer.from(pass).toString('base64'), 235);
        }

        // 5. Envelope
        await sendCommand(`MAIL FROM:<${from}>`, 250);
        await sendCommand(`RCPT TO:<${to}>`, [250, 251]);

        // 6. Data payload
        await sendCommand('DATA', 354);
        socket.write(data.replace(/\r?\n/g, '\r\n') + '\r\n.\r\n');
        const dataResp = await readResponse();
        if (dataResp.code !== 250) {
          throw new Error(`Failed to transmit message DATA: ${dataResp.code} ${dataResp.text}`);
        }

        // 7. QUIT
        try {
          await sendCommand('QUIT', 221);
        } catch {
          // ignore quit errors
        }

        cleanup();
        resolve();
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    // Connect
    if (secure) {
      socket = tls.connect(port, host, { rejectUnauthorized: false }, () => {
        runConversation();
      });
    } else {
      socket = net.createConnection(port, host, () => {
        runConversation();
      });
    }

    socket.once('error', (err) => {
      cleanup();
      reject(err);
    });
  });
}

/**
 * Format standard RFC 822 email message.
 */
function buildRfc822(options: EmailOptions, envelopeFrom: string): string {
  const fromHeader = options.fromName
    ? `"${options.fromName.replace(/"/g, '')}" <${envelopeFrom}>`
    : envelopeFrom;

  const headers = [
    `From: ${fromHeader}`,
    `To: <${options.to}>`,
    `Subject: ${options.subject}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${Date.now()}.${Math.random().toString(36).substring(2)}@swyftpain.dev>`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    `Content-Transfer-Encoding: 8bit`,
  ];

  if (options.replyTo) {
    headers.push(`Reply-To: <${options.replyTo}>`);
  }

  return headers.join('\r\n') + '\r\n\r\n' + options.text;
}

/**
 * Sends email via Resend API if RESEND_API_KEY is configured.
 */
async function sendViaResend(options: EmailOptions, apiKey: string): Promise<MailDeliveryResult> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'SwyftPain Mentorship <onboarding@resend.dev>',
      to: [options.to],
      reply_to: options.replyTo,
      subject: options.subject,
      text: options.text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend API error (${res.status}): ${errText}`);
  }

  return {
    delivered: true,
    method: 'resend',
    message: 'Email delivered successfully via Resend API.',
  };
}

/**
 * Main email dispatcher that handles SMTP, Resend, or direct MX routing.
 */
export async function sendEmail(options: EmailOptions): Promise<MailDeliveryResult> {
  // Ensure .env is loaded into process.env
  ensureEnvLoaded();

  // 1. Try Resend if API key is provided
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    try {
      return await sendViaResend(options, resendKey);
    } catch (err) {
      console.error('[Mailer] Resend attempt failed:', err);
    }
  }

  // 2. Try configured SMTP relay
  const rawHost = process.env.SMTP_HOST?.trim();
  const rawUser = process.env.SMTP_USER?.trim().replace(/^["']|["']$/g, '');
  const rawPass = process.env.SMTP_PASS?.trim().replace(/^["']|["']$/g, '');

  const smtpHost = rawHost || (rawUser?.includes('@gmail.com') ? 'smtp.gmail.com' : undefined);
  const smtpUser = rawUser;
  // Clean app password of spaces (Google's "xxxx xxxx xxxx xxxx" display format)
  const smtpPass = rawPass ? rawPass.replace(/\s+/g, '') : undefined;

  if (smtpHost && smtpUser && smtpPass) {
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    // With Gmail and authenticated SMTP, envelope sender must be the authenticated user
    const envelopeFrom = smtpUser;
    const rfc822 = buildRfc822(options, envelopeFrom);

    console.log(`[Mailer] Connecting to SMTP relay at ${smtpHost}:${port} (secure=${secure}) as ${smtpUser}...`);

    try {
      await sendSmtpRaw({
        host: smtpHost,
        port,
        secure,
        user: smtpUser,
        pass: smtpPass,
        from: envelopeFrom,
        to: options.to,
        data: rfc822,
        timeoutMs: 15000,
      });

      console.log(`[Mailer] Successfully transmitted email to ${options.to} via ${smtpHost}`);
      return {
        delivered: true,
        method: 'smtp',
        message: 'Email delivered successfully via SMTP server.',
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[Mailer] Configured SMTP relay failed:', errorMsg);
      throw new Error(`SMTP relay error: ${errorMsg}`);
    }
  }

  // 3. Fallback: Try direct MX lookup and delivery (for gmail.com)
  const domain = options.to.split('@')[1];
  if (domain) {
    try {
      const mxRecords = await dns.resolveMx(domain);
      mxRecords.sort((a, b) => a.priority - b.priority);

      if (mxRecords.length > 0 && mxRecords[0]?.exchange) {
        const mxHost = mxRecords[0].exchange;
        console.log(`[Mailer] Attempting direct MX delivery to ${mxHost}:25...`);

        const rfc822 = buildRfc822(options, options.from);
        await sendSmtpRaw({
          host: mxHost,
          port: 25,
          secure: false,
          from: options.from,
          to: options.to,
          data: rfc822,
          timeoutMs: 8000,
        });

        return {
          delivered: true,
          method: 'direct-mx',
          message: `Email accepted directly by incoming mail server (${mxHost}).`,
        };
      }
    } catch (err) {
      const errStr = err instanceof Error ? err.message : String(err);
      console.warn(`[Mailer] Direct MX delivery attempt failed (${errStr}). Port 25 is typically blocked by home ISPs.`);
    }
  }

  // If credentials are missing
  return {
    delivered: false,
    method: 'none',
    message: 'SMTP credentials not found in environment.',
    error: 'Missing SMTP credentials in .env. Please ensure SMTP_USER and SMTP_PASS are defined.',
  };
}
