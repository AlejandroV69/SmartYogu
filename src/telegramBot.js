const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

/**
 * Envía un mensaje al bot de Telegram configurado.
 * @param {string} text - Texto del mensaje (soporta Markdown).
 */
export async function sendTelegramMessage(text) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('Telegram: Variables de entorno no configuradas.');
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('Telegram error:', err);
    }
  } catch (err) {
    console.error('Error enviando mensaje a Telegram:', err);
  }
}

/**
 * Envía una foto con descripción al bot de Telegram.
 * @param {File} file - Archivo de imagen.
 * @param {string} caption - Texto de descripción (soporta HTML).
 */
export async function sendTelegramPhoto(file, caption) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('Telegram: Variables de entorno no configuradas.');
    return;
  }

  const formData = new FormData();
  formData.append('chat_id', CHAT_ID);
  formData.append('photo', file);
  if (caption) {
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('Telegram error:', err);
      throw new Error(err.description || 'Error enviando foto');
    }
  } catch (err) {
    console.error('Error enviando foto a Telegram:', err);
    throw err;
  }
}

/**
 * Devuelve el emoji correspondiente al tipo de entrega.
 */
function getEmojiEntrega(tipo) {
  if (tipo === 'AutoServicio') return '🟢';
  if (tipo === 'Pick-up') return '🔵';
  if (tipo === 'Delivery') return '🟠';
  return '📍';
}

/**
 * Notifica un nuevo pedido creado.
 */
export function buildNuevoPedidoMsg({ cliente_nombre, cedula, telefono, tipo_entrega, direccion_envio, total }) {
  const direccionLine = tipo_entrega === 'Delivery' && direccion_envio
    ? `\n🏠 <b>Dirección:</b> ${direccion_envio}`
    : '';

  return (
    `🍦 <b>¡NUEVO PEDIDO EN SMARTYOGU!</b>\n\n` +
    `👤 <b>Cliente:</b> ${cliente_nombre}\n` +
    `🪪 <b>Cédula:</b> ${cedula}\n` +
    `📱 <b>Teléfono:</b> ${telefono}\n\n` +
    `${getEmojiEntrega(tipo_entrega)} <b>Modalidad:</b> ${tipo_entrega}` +
    `${direccionLine}\n` +
    `💰 <b>Total:</b> $${Number(total).toFixed(2)}\n` +
    `📌 <b>Estado:</b> Pendiente por Pago`
  );
}

/**
 * Notifica cuando el cliente sube su comprobante de pago.
 */
export function buildComprobantePagadoMsg({ cliente_nombre, cedula, telefono, tipo_entrega, direccion_envio, numero_transaccion, total }) {
  const direccionLine = tipo_entrega === 'Delivery' && direccion_envio
    ? `\n🏠 <b>Dirección:</b> ${direccion_envio}`
    : '';

  return (
    `💸 <b>¡COMPROBANTE RECIBIDO EN SMARTYOGU!</b>\n\n` +
    `👤 <b>Cliente:</b> ${cliente_nombre}\n` +
    `🪪 <b>Cédula:</b> ${cedula}\n` +
    `📱 <b>Teléfono:</b> ${telefono}\n\n` +
    `${getEmojiEntrega(tipo_entrega)} <b>Modalidad:</b> ${tipo_entrega}` +
    `${direccionLine}\n` +
    `💳 <b>Ref. Pago:</b> ${numero_transaccion || 'No indicada'}\n` +
    `💰 <b>Total:</b> $${Number(total).toFixed(2)}\n` +
    `📌 <b>Estado:</b> Pago por Verificar`
  );
}
