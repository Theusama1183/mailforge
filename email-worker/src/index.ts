export default {
  async email(message, env, ctx) {
    console.log(`EMAIL RECEIVED: from=${message.from} to=${message.to}`);

    try {
      const toAddr = message.to;
      const [localPart, domain] = toAddr.split('@');
      if (!localPart || !domain) {
        console.log(`Invalid address: ${toAddr}`);
        return;
      }

      // Look up domain
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
      const domains = await domainRes.json();
      if (!domains?.length) {
        console.log(`No domain found: ${domain}`);
        return;
      }
      const domainRecord = domains[0];
      console.log(`Found domain: ${domainRecord.id} user=${domainRecord.user_id}`);

      // Look up email address
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
      const addresses = await addrRes.json();
      if (!addresses?.length) {
        console.log(`No email address found: ${localPart}@${domain}`);
        return;
      }
      console.log(`Found email address: ${addresses[0].id}`);

      // Parse raw email
      let subject = '', text = '', html = '', messageId = '', fromName = '';
      try {
        const rawText = await new Response(message.raw).text();
        console.log(`Raw size: ${rawText.length}`);

        const lines = rawText.split(/\r?\n/);
        const boundaryParts: { headers: string; body: string }[] = [];
        let currentHeader = '';
        let currentBody = '';
        let inBody = false;
        let topBoundary = '';
        let inTopHeaders = true;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (inTopHeaders) {
            if (line.startsWith('Subject: ')) subject = line.slice(9).trim();
            else if (line.startsWith('Message-ID: ')) messageId = line.slice(12).trim();
            else if (line.startsWith('From: ')) {
              const n = line.slice(6).match(/"?([^"<]*)"?\s*</);
              if (n) fromName = n[1].trim();
            }
            if (line.startsWith('Content-Type: multipart/')) {
              const bm = line.match(/boundary\s*=\s*"?([^";\s]+)"?/);
              if (bm) topBoundary = bm[1];
            }
            if (line.trim() === '') inTopHeaders = false;
            continue;
          }
          if (topBoundary && line.trim() === '--' + topBoundary) {
            if (currentHeader) {
              boundaryParts.push({ headers: currentHeader, body: currentBody });
            }
            currentHeader = '';
            currentBody = '';
            inBody = false;
            continue;
          }
          if (topBoundary && line.trim() === '--' + topBoundary + '--') {
            if (currentHeader) {
              boundaryParts.push({ headers: currentHeader, body: currentBody });
            }
            continue;
          }
          if (topBoundary && !inBody && line.trim() === '') {
            inBody = true;
            continue;
          }
          if (topBoundary) {
            if (inBody) {
              currentBody += (currentBody ? '\n' : '') + line;
            } else {
              currentHeader += (currentHeader ? '\n' : '') + line;
            }
          }
        }

        if (topBoundary && boundaryParts.length > 0) {
          for (const bp of boundaryParts) {
            const isTextPlain = /^Content-Type:\s*text\/plain/i.test(bp.headers);
            const isTextHtml = /^Content-Type:\s*text\/html/i.test(bp.headers);
            const isQP = /Content-Transfer-Encoding:\s*quoted-printable/i.test(bp.headers);
            let decoded = bp.body;
            if (isQP) {
              decoded = decoded.replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
            }
            if (isTextPlain && !text) text = decoded;
            if (isTextHtml && !html) html = decoded;
          }
          text = text || html?.replace(/<[^>]*>/g, '').trim() || 'text/html fallback';
        } else {
          let inHeader = true;
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (inHeader) {
              if (line.startsWith('Subject: ')) subject = line.slice(9).trim();
              else if (line.startsWith('Message-ID: ')) messageId = line.slice(12).trim();
              else if (line.startsWith('From: ')) {
                const n = line.slice(6).match(/"?([^"<]*)"?\s*</);
                if (n) fromName = n[1].trim();
              }
              if (line.trim() === '') inHeader = false;
            } else {
              text += (text ? '\n' : '') + line;
            }
          }
          text = text?.trim() || '';
        }
      } catch (parseErr) {
        console.log(`Parse error: ${parseErr.message}`);
      }

      // Call webhook
      const payload = {
        from: { address: message.from, name: fromName },
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

      // Forward copy if configured
      if (env.FORWARD_TO) {
        await message.forward(env.FORWARD_TO);
      }
    } catch (error) {
      console.error(`Worker error: ${error.message} ${error.stack}`);
      if (env.FORWARD_TO) {
        try { await message.forward(env.FORWARD_TO); } catch {}
      }
    }
  },
};
