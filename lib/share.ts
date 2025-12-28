/**
 * Generar mensaje para compartir en WhatsApp
 */
export function generateWhatsAppMessage(
  description: string,
  amount: number,
  currency: string,
  url: string
): string {
  const message = `💰 *Solicitud de Pago*\n\n📝 ${description}\n💵 Monto: ${amount} ${currency}\n\n🔗 Paga aquí: ${url}\n\n✨ Pago rápido y seguro con Stellar`;

  return encodeURIComponent(message);
}

/**
 * Generar URL de WhatsApp
 */
export function getWhatsAppShareUrl(
  description: string,
  amount: number,
  currency: string,
  paymentUrl: string,
  phoneNumber?: string
): string {
  const message = generateWhatsAppMessage(description, amount, currency, paymentUrl);
  
  if (phoneNumber) {
    // Compartir con número específico
    return `https://wa.me/${phoneNumber}?text=${message}`;
  }
  
  // Compartir general
  return `https://wa.me/?text=${message}`;
}

/**
 * Generar mensaje para Telegram
 */
export function generateTelegramMessage(
  description: string,
  amount: number,
  currency: string,
  url: string
): string {
  const message = `💰 *Solicitud de Pago*\n\n📝 ${description}\n💵 Monto: ${amount} ${currency}\n\n🔗 Paga aquí:\n${url}\n\n✨ Pago rápido y seguro con Stellar`;

  return encodeURIComponent(message);
}

/**
 * Generar URL de Telegram
 */
export function getTelegramShareUrl(
  description: string,
  amount: number,
  currency: string,
  paymentUrl: string
): string {
  const message = generateTelegramMessage(description, amount, currency, paymentUrl);
  return `https://t.me/share/url?url=${encodeURIComponent(paymentUrl)}&text=${message}`;
}

/**
 * Generar mensaje para Email
 */
export function generateEmailMessage(
  description: string,
  amount: number,
  currency: string,
  url: string
): { subject: string; body: string } {
  const subject = `Solicitud de Pago: ${description}`;
  const body = `Hola,

Te envío esta solicitud de pago por:

Descripción: ${description}
Monto: ${amount} ${currency}

Para realizar el pago, haz clic en el siguiente enlace:
${url}

El pago es procesado de forma segura a través de la blockchain de Stellar.

¡Gracias!`;

  return {
    subject: encodeURIComponent(subject),
    body: encodeURIComponent(body),
  };
}

/**
 * Generar URL de Email mailto
 */
export function getEmailShareUrl(
  description: string,
  amount: number,
  currency: string,
  paymentUrl: string,
  toEmail?: string
): string {
  const { subject, body } = generateEmailMessage(description, amount, currency, paymentUrl);
  
  const mailto = toEmail ? `mailto:${toEmail}` : 'mailto:';
  return `${mailto}?subject=${subject}&body=${body}`;
}

/**
 * Copiar al portapapeles
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

/**
 * Compartir usando Web Share API (si está disponible)
 */
export async function shareViaWebShare(data: {
  title: string;
  text: string;
  url: string;
}): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    // Usuario canceló o error
    return false;
  }
}

/**
 * Verificar si Web Share API está disponible
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}
