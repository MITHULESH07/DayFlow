const RESEND_API_URL = "https://api.resend.com/emails";

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

async function sendEmployeePasswordEmail({ to, name, employeeId, password }) {
  if (!to || !name || !employeeId || !password) {
    throw new Error("to, name, employeeId, and password are required");
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    throw new Error("RESEND_API_KEY and RESEND_FROM_EMAIL must be configured");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [to],
      subject: "Your employee account details",
      text: [
        `Hello ${name},`,
        "",
        "Your employee account has been created.",
        `Login ID: ${employeeId}`,
        `Temporary password: ${password}`,
        "",
        "Please change your password after your first sign-in.",
      ].join("\n"),
      html: `<p>Hello ${escapeHtml(name)},</p>
        <p>Your employee account has been created.</p>
        <p><strong>Login ID:</strong> ${escapeHtml(employeeId)}<br>
        <strong>Temporary password:</strong> ${escapeHtml(password)}</p>
        <p>Please change your password after your first sign-in.</p>`,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Resend failed to send the email");
  }

  return result;
}

module.exports = { sendEmployeePasswordEmail };
