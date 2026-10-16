// Sends the SuperAdmin an email through EmailJS (https://www.emailjs.com) without a backend.
// Configure VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID and VITE_EMAILJS_PUBLIC_KEY in .env.local
// (see .env.example). The recipient address is set inside the EmailJS template, not here.
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const isEmailNotifyConfigured = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

// Never include the applicant's password here.
export async function notifySuperAdminOfAdminRequest({ applicantEmail, courtName, requestedAt }) {
  if (!isEmailNotifyConfigured) return false;
  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      template_params: {
        applicant_email: applicantEmail,
        court_name: courtName,
        requested_at: new Date(requestedAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
        review_url: window.location.origin,
      },
    }),
  });
  return response.ok;
}
