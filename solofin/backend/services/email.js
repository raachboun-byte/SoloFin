// Service d'envoi d'email via Nodemailer SMTP — SoloFin
// Rachid utilise Gmail SMTP avec un App Password (pas le mot de passe du compte)
// Pour créer un App Password : compte Google → Sécurité → Mots de passe des applications → "SoloFin"
const nodemailer = require('nodemailer');
const logger     = require('./logger');

let transport = null;

function getTransport() {
  if (transport) return transport;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return null;
  }

  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transport;
}

/**
 * Envoie un email via SMTP.
 * @param {{ to: string, subject: string, text: string }} options
 * @returns {{ success: boolean, error: string|null }}
 */
async function envoyerEmail({ to, subject, text }) {
  const t = getTransport();

  if (!t) {
    const msg = 'SMTP non configuré — définir SMTP_USER et SMTP_PASSWORD dans .env';
    logger.warn(msg);
    return { success: false, error: msg };
  }

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return { success: true, error: null };
  } catch (err) {
    logger.error({ err }, 'Erreur envoi email');
    return { success: false, error: err.message };
  }
}

module.exports = { envoyerEmail };
