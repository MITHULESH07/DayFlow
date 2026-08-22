const { sendEmployeePasswordEmail: sendFromEmailFolder } = require('../../email/email');

const isConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);

async function sendEmployeePasswordEmail(details) {
  if (!isConfigured()) {
    return {
      skipped: true,
      reason: 'RESEND_API_KEY and RESEND_FROM_EMAIL are not configured',
    };
  }

  return sendFromEmailFolder(details);
}

module.exports = { sendEmployeePasswordEmail, isConfigured };
