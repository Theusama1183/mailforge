import PostalMime from 'postal-mime';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  WEBHOOK_URL: string;
  WEBHOOK_SECRET: string;
  FORWARD_TO?: string;
}

export default {
  async email(message: ForwardableEmailMessage, env: Env, _ctx: ExecutionContext) {
    console.log(`EMAIL RECEIVED: from=${message.from} to=${message.to}`);

    try {
      const toAddr = message.to;
      const [localPart, domain] = toAddr.split('@');
      if (!localPart || !domain) {
        console.log(`Invalid address: ${toAddr}`);
        return;
      }

      // ── Look up domain ──
      const domainRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/domains?select=id,user_id&domain=eq.${encodeURIComponent(domain)}&limit=1`,
        {
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );
      if (!domainRes.ok) {
        console.log(`Domain lookup failed: ${domainRes.status} ${await domainRes.text()}`);
        return;
      }
      const domains = await domainRes.json() as any[];
      if (!domains?.length) {
        console.log(`No domain found: ${domain}`);
        return;
      }
      const domainRecord = domains[0];
      console.log(`Found domain: ${domainRecord.id} user=${domainRecord.user_id}`);

      // ── Look up email address ──
      const addrRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/email_addresses?select=id&domain_id=eq.${domainRecord.id}&local_part=eq.${encodeURIComponent(localPart)}&limit=1`,
        {
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );
      if (!addrRes.ok) {
        console.log(`Email lookup failed: ${addrRes.status} ${await addrRes.text()}`);
        return;
      }
      const addresses = await addrRes.json() as any[];
      if (!addresses?.length) {
        console.log(`No email address found: ${localPart}@${domain}`);
        return;
      }
      console.log(`Found email address: ${addresses[0].id}`);

      // ── Parse raw email with postal-mime ──
      let subject = '';
      let text = '';
      let html = '';
      let messageId = '';
      let fromAddress = message.from;
      let fromName = '';

      try {
        const parsed = await PostalMime.parse(message.raw);
        subject = parsed.subject || '';
        text = parsed.text || '';
        html = parsed.html || '';
        messageId = parsed.messageId || '';
        if (parsed.from && typeof parsed.from === 'object' && 'address' in parsed.from) {
          fromAddress = parsed.from.address || message.from;
          fromName = parsed.from.name || '';
        }
        console.log(`Parsed: subject="${subject?.slice(0, 50)}" html=${(html?.length || 0)}b text=${(text?.length || 0)}b`);
      } catch (parseErr: any) {
        console.log(`Parse error: ${parseErr.message}`);
        // Fall back to raw headers/body if parsing fails completely
        try {
          const rawText = await new Response(message.raw).text();
          const lines = rawText.split(/\r?\n/);
          for (const line of lines) {
            if (line.startsWith('Subject: ')) { subject = line.slice(9).trim(); break; }
          }
          text = '(unable to parse email)';
        } catch {}
      }

      // ── Call webhook ──
      const payload = {
        from: { address: fromAddress, name: fromName },
        to: toAddr,
        subject,
        text,
        html,
        messageId,
        userId: domainRecord.user_id,
      };

      console.log(`Calling webhook for ${toAddr}`);
      const webhookRes = await fetch(env.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': env.WEBHOOK_SECRET,
        },
        body: JSON.stringify(payload),
      });

      if (!webhookRes.ok) {
        const errText = await webhookRes.text();
        console.log(`Webhook failed: ${webhookRes.status} ${errText}`);
      } else {
        console.log(`Webhook success for ${toAddr}`);
      }

      // ── Forward copy if configured ──
      if (env.FORWARD_TO) {
        await message.forward(env.FORWARD_TO);
      }
    } catch (error: any) {
      console.error(`Worker error: ${error.message} ${error.stack}`);
      if (env.FORWARD_TO) {
        try { await message.forward(env.FORWARD_TO); } catch {}
      }
    }
  },
};
