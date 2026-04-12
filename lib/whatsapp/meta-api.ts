type WhatsAppTemplateSendInput = {
  to: string
  templateName: string
  languageCode?: string
  headerUrl?: string
  headerType?: 'image' | 'video'
  buttonUrlSuffix?: string
  buttonIndex?: number
  components?: TemplateComponent[]
}

type HeaderParameter =
  | { type: 'image'; image: { link: string } }
  | { type: 'video'; video: { link: string } }

type ButtonParameter = { type: 'text'; text: string }

type TemplateParameter = HeaderParameter | ButtonParameter

type TemplateComponent = {
  type: 'header' | 'body' | 'button'
  sub_type?: 'url'
  index?: string
  parameters?: TemplateParameter[]
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

function inferHeaderMediaType(url: string): 'image' | 'video' {
  const normalized = url.split('?')[0].toLowerCase()

  if (normalized.endsWith('.mp4') || normalized.endsWith('.mov') || normalized.endsWith('.webm') || normalized.endsWith('.m4v')) {
    return 'video'
  }

  if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg') || normalized.endsWith('.png') || normalized.endsWith('.webp') || normalized.endsWith('.gif')) {
    return 'image'
  }

  return 'video'
}

function buildHeaderComponent(url: string, forcedType?: 'image' | 'video'): TemplateComponent {
  const mediaType = forcedType ?? inferHeaderMediaType(url)

  if (mediaType === 'image') {
    return {
      type: 'header',
      parameters: [{ type: 'image', image: { link: url } }],
    }
  }

  return {
    type: 'header',
    parameters: [{ type: 'video', video: { link: url } }],
  }
}

function buildButtonComponent(urlSuffix: string, index = 0): TemplateComponent {
  return {
    type: 'button',
    sub_type: 'url',
    index: String(index),
    parameters: [{ type: 'text', text: urlSuffix }],
  }
}

export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = 'en',
  headerUrl,
  headerType,
  buttonUrlSuffix,
  buttonIndex = 0,
  components,
}: WhatsAppTemplateSendInput): Promise<MetaSendResponse> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  const defaultDemoMediaUrl = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL

  if (!token || !phoneId) {
    throw new Error('Missing WhatsApp configuration: WHATSAPP_TOKEN or WHATSAPP_PHONE_ID')
  }

  let templateComponents = [...(components ?? [])]

  if (headerUrl) {
    const hasHeader = templateComponents.some((component) => component.type === 'header')
    if (!hasHeader) {
      templateComponents.push(buildHeaderComponent(headerUrl, headerType))
    }
  }

  if (!templateComponents?.length && templateName === 'claux_stage1_welcome') {
    const url = defaultDemoMediaUrl
    if (!url) {
      throw new Error('Missing header media URL for claux_stage1_welcome. Set headerUrl or NEXT_PUBLIC_DEMO_VIDEO_URL.')
    }
    templateComponents = [buildHeaderComponent(url, headerType)]
  }

  if (buttonUrlSuffix) {
    const hasUrlButton = templateComponents.some((component) => component.type === 'button' && component.sub_type === 'url')
    if (!hasUrlButton) {
      templateComponents.push(buildButtonComponent(buttonUrlSuffix, buttonIndex))
    }
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
      ...(templateComponents?.length ? { components: templateComponents } : {}),
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
