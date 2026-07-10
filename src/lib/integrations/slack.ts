export async function sendSlackNotification(
  webhookUrl: string,
  message: string,
  options?: { title?: string; color?: string; fields?: { title: string; value: string; short?: boolean }[] }
): Promise<boolean> {
  try {
    const blocks: Record<string, unknown>[] = []

    if (options?.title) {
      blocks.push({
        type: "header",
        text: { type: "plain_text", text: options.title, emoji: true },
      })
    }

    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: message },
    })

    if (options?.fields?.length) {
      blocks.push({
        type: "section",
        fields: options.fields.map((f) => ({
          type: "mrkdwn",
          text: `*${f.title}:*\n${f.value}`,
        })),
      })
    }

    const payload: Record<string, unknown> = { blocks }

    if (options?.color) {
      payload.attachments = [{ color: options.color }]
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    return res.ok
  } catch {
    return false
  }
}
