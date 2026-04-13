type WhatsAppTemplateSendInput = {
  to: string
  templateName: string
  languageCode?: string
}

type MetaMessage = {
  id?: string
}

type MetaError = {
  message?: string
  type?: string
  code?: number
  error_subcode?: number
  fbtrace_id?: string
}

type MetaSendResponse = {
  messaging_product?: 'whatsapp'
  contacts?: Array<{ wa_id?: string; input?: string }>
  messages?: MetaMessage[]
  error?: MetaError
}

type WhatsAppTextSendInput = {
  to: string
  text: string
}

export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = 'en',
}: WhatsAppTemplateSendInput): Promise<MetaSendResponse> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID

  if (!token || !phoneId) {
    throw new Error('Missing WhatsApp configuration: WHATSAPP_TOKEN or WHATSAPP_PHONE_ID')
  }

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
    },
  }

  console.log('[META_DEBUG_PAYLOAD]', JSON.stringify(payload, null, 2))

  const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json().catch(() => ({}))) as MetaSendResponse

  if (!response.ok) {
    const reason = data?.error?.message || 'Unknown Meta API error'
    throw new Error(`Meta template send failed: ${reason}`)
  }

  return data
}

export async function sendWhatsAppText({ to, text }: WhatsAppTextSendInput): Promise<MetaSendResponse> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID

  if (!token || !phoneId) {
    throw new Error('Missing WhatsApp configuration: WHATSAPP_TOKEN or WHATSAPP_PHONE_ID')
  }

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: {
      body: text,
    },
  }

  const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json().catch(() => ({}))) as MetaSendResponse

  if (!response.ok) {
    const reason = data?.error?.message || 'Unknown Meta API error'
    throw new Error(`Meta text send failed: ${reason}`)
  }

  return data
}
