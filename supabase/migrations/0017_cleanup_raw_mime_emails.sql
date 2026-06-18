-- 0017_cleanup_raw_mime_emails.sql
-- Clean up emails corrupted by the old hand-rolled MIME parser in the Cloudflare Worker.
-- The parser failed to detect MIME boundaries when Content-Type was folded across lines,
-- so raw MIME content (--boundary markers, part headers) was stored as body_text/html.

-- Find corrupted emails count (body_text starts with '--' MIME boundary)
select count(*) as corrupted_emails_found
from emails
where body_text ~ '^--';

-- For body_text that is raw MIME: extract the HTML/text between the first
-- boundary's headers and the closing boundary, set it as body_html.
-- This uses regex to find and extract the actual content from MIME-wrapped emails.
update emails
set
  body_html = trim(
    regexp_replace(
      regexp_replace(
        body_text,
        '^--.+--\s*\n(?:Content-Type:[^\n]*\n)*(?:Content-Transfer-Encoding:[^\n]*\n)*(?:MIME-Version:[^\n]*\n)*\s*\n',
        '',
        'n'
      ),
      '\n--.*$',
      '',
      'n'
    )
  ),
  body_text = null
where body_text ~ '^--'
  and (body_html is null or body_html = '');

-- Double-check: for any remaining body_text that has <html or <!DOCTYPE, extract to body_html
update emails
set
  body_html = body_text,
  body_text = null
where body_text ~* '<(?:html|!DOCTYPE|div|p|h[1-6]|body|table)'
  and (body_html is null or body_html = '')
  and body_text !~ '^--';

-- Report remaining corrupt emails (should be 0 after fix is deployed)
select count(*) as still_corrupt
from emails
where body_text ~ '^--';
