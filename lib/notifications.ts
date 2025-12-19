type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
};

function hasResendConfig() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  if (!hasResendConfig()) {
    console.warn('RESEND_API_KEY no está configurado. Se omite envío de email.');
    return { success: false, error: 'Resend not configured' };
  }

  const from = payload.from || process.env.RESEND_FROM || 'PayByLink <no-reply@paybylink.app>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('Resend error:', res.status, body);
      return { success: false, error: `Resend error: ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Resend request failed:', err?.message || err);
    return { success: false, error: 'Resend request failed' };
  }
}

export async function sendPaymentCompletedEmail(to: string, details: {
  id: string;
  amount: number;
  currency: 'USDC' | 'XLM';
  description: string;
  recipient: string;
  txHash: string;
}) {
  const subject = `Pago completado – ${details.amount} ${details.currency}`;

  const explorerBase = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'
    ? 'https://stellar.expert/explorer/public/tx/'
    : 'https://stellar.expert/explorer/testnet/tx/';

  const txUrl = `${explorerBase}${details.txHash}`;

  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Pago completado en PayByLink</h2>
      <p><strong>Monto:</strong> ${details.amount} ${details.currency}</p>
      <p><strong>Descripción:</strong> ${details.description}</p>
      <p><strong>Destino (Stellar):</strong> ${details.recipient}</p>
      <p><strong>ID del enlace:</strong> ${details.id}</p>
      <p><strong>Transacción:</strong> <a href="${txUrl}" target="_blank" rel="noopener">Ver en Stellar Expert</a></p>
      <hr/>
      <p>Gracias por usar PayByLink.</p>
    </div>
  `;

  const text = `Pago completado en PayByLink\n\nMonto: ${details.amount} ${details.currency}\nDescripción: ${details.description}\nDestino: ${details.recipient}\nID del enlace: ${details.id}\nTransacción: ${txUrl}`;

  return sendEmail({ to, subject, html, text });
}
