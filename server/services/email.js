const nodemailer = require('nodemailer');
const dns = require('dns');

/**
 * Risolve dinamicamente l'hostname SMTP su IPv4 per evitare
 * errori di connessione IPv6 (EHOSTUNREACH) su reti locali o container.
 */
function resolveIpv4(hostname) {
  return new Promise((resolve) => {
    dns.resolve4(hostname, (err, addrs) => {
      if (!err && addrs && addrs.length > 0) {
        resolve(addrs[0]);
      } else {
        resolve(hostname);
      }
    });
  });
}

/**
 * Crea il transporter SMTP configurato per Gmail / Google Workspace (noreply@dbasti.com)
 */
async function createTransporter() {
  const hostName = process.env.SMTP_HOST || 'smtp.gmail.com';
  const resolvedHost = await resolveIpv4(hostName);
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER || 'noreply@dbasti.com';
  const rawPass = process.env.SMTP_PASS || process.env.EMAIL || 'escs ldni mhmj njnv';
  const pass = rawPass.replace(/\s+/g, '');

  return nodemailer.createTransport({
    host: resolvedHost,
    port,
    secure: true,
    servername: hostName,
    tls: {
      servername: hostName
    },
    auth: {
      user,
      pass
    }
  });
}

/**
 * Invia email HTML con grafica moderna Salesiana Don Bosco per il recupero password
 */
async function sendPasswordResetEmail({ toEmail, fullName, resetToken, resetCode, resetLink }) {
  const transporter = await createTransporter();
  const fromName = process.env.EMAIL_FROM_NAME || 'Oratorio Salesiano Don Bosco Asti';
  const fromAddress = process.env.SMTP_USER || 'noreply@dbasti.com';

  const htmlContent = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recupero Password - GMG Seoul 2027</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- Header Salesiano GMG -->
          <tr>
            <td style="background: linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #e11d48 100%); padding: 35px 30px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="background-color: #ffffff; color: #e11d48; width: 54px; height: 54px; border-radius: 14px; line-height: 54px; font-size: 22px; font-weight: 800; margin: 0 auto 12px auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                      27
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">
                      GMG Seoul 2027
                    </h1>
                    <p style="color: rgba(255, 255, 255, 0.9); margin: 6px 0 0 0; font-size: 14px; font-weight: 500;">
                      Oratorio Salesiano Don Bosco • Asti
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 35px 30px;">
              <h2 style="margin: 0 0 16px 0; font-size: 19px; font-weight: 700; color: #0f172a;">
                Reimpostazione della Password
              </h2>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Ciao <strong>${fullName || 'Pellegrino'}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                abbiamo ricevuto una richiesta per reimpostare la password di accesso al portale della raccolta fondi della GMG associato a questo indirizzo email.
              </p>

              <!-- Box Codice Rapido -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 25px 0;">
                <tr>
                  <td style="background-color: #f1f5f9; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center;">
                    <span style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 8px;">
                      Codice di Verifica a 6 Cifre
                    </span>
                    <span style="display: block; font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 0.25em; color: #1e293b;">
                      ${resetCode}
                    </span>
                    <span style="display: block; font-size: 12px; color: #94a3b8; margin-top: 6px;">
                      Puoi inserire questo codice direttamente nella schermata del sito
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Pulsante Diretto -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0 25px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; background-color: #e11d48; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.35);">
                      Reimposta Password Adesso →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 25px 0 0 0; font-size: 13px; line-height: 1.6; color: #64748b;">
                ⏱️ Il link e il codice di verifica sono validi per <strong>60 minuti</strong>.<br>
                Se non sei stato tu a richiedere il ripristino, ignora pure questo messaggio: la tua password attuale rimane invariata e il tuo account è al sicuro.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 30px; text-align: center;">
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: #475569;">
                Oratorio Salesiano Don Bosco — Corso Dante 188, Asti
              </p>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #94a3b8;">
                «Abbiate coraggio: io ho vinto il mondo!» (Gv 16,33) • In cammino verso Seoul 2027
              </p>
              <p style="margin: 10px 0 0 0; font-size: 11px; color: #cbd5e1;">
                Messaggio automatico inviato da noreply@dbasti.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textContent = `
GMG Seoul 2027 • Oratorio Salesiano Don Bosco Asti
Reimpostazione della Password

Ciao ${fullName || 'Pellegrino'},
Abbiamo ricevuto una richiesta per reimpostare la tua password di accesso al portale GMG.

Il tuo codice di verifica è: ${resetCode}

Oppure clicca su questo link per scegliere una nuova password:
${resetLink}

Il codice e il link sono validi per 60 minuti.
Se non hai richiesto tu il ripristino, puoi ignorare questa email.
  `;

  return await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: toEmail,
    subject: `🔐 Codice di Recupero Password: ${resetCode} • Portale GMG Don Bosco Asti`,
    text: textContent,
    html: htmlContent
  });
}

module.exports = {
  createTransporter,
  sendPasswordResetEmail
};
