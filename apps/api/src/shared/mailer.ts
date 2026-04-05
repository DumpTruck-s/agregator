/**
 * Returns true if email was sent successfully, false otherwise.
 * Caller can use the return value to decide whether to expose the code as fallback.
 */
export async function sendVerificationEmail(to: string, name: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n📧 [MAIL] Verification code for ${to}: ${code}\n`);
    return false;
  }

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0F1115;color:#e2e8f0;border-radius:16px">
      <h2 style="margin:0 0 8px;font-size:22px;color:#fff">Подтвердите email</h2>
      <p style="color:#94a3b8;margin:0 0 24px">Привет, ${name}! Ваш код подтверждения:</p>
      <div style="background:#1A1D23;border:1px solid #00D1FF33;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
        <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#00D1FF">${code}</span>
      </div>
      <p style="color:#64748b;font-size:13px;margin:0">Код действует 15 минут. Если вы не регистрировались — просто проигнорируйте это письмо.</p>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? 'onboarding@resend.dev',
        to: [to],
        subject: `${code} — ваш код подтверждения`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Mailer] Resend error:', err);
      console.log(`📧 [MAIL FALLBACK] Code for ${to}: ${code}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Mailer] Network error:', e);
    console.log(`📧 [MAIL FALLBACK] Code for ${to}: ${code}`);
    return false;
  }
}
