-- 0018_fix_mime_cleanup.sql
-- Properly clean up MIME-corrupted emails from the old hand-rolled parser.
-- The previous migration (0017) had a regex that didn't handle:
--   1. MIME headers in varying orders (Content-Type → MIME-Version → Content-Transfer-Encoding)
--   2. Base64-encoded content (most AI-agent emails use base64)
--
-- This migration:
--   1. Strips the opening MIME boundary + all headers up to the first blank line
--   2. Strips the trailing closing boundary (--boundary--)
--   3. Base64-decodes the content if Content-Transfer-Encoding was base64
--   4. Sets the result as body_html

-- Clean base64-encoded MIME content
UPDATE emails
SET
  body_html = convert_from(
    decode(
      regexp_replace(
        regexp_replace(
          -- Extract everything after first blank line (after headers)
          substring(body_html from E'\n\n(.*)$'),
          -- Remove trailing boundary line(s)
          E'\n--.*$', '', 'n'
        ),
        -- Remove any whitespace/newlines in the base64 string
        E'\\s', '', 'g'
      ),
      'base64'
    ),
    'UTF8'
  ),
  body_text = NULL
WHERE body_html ~ '^--==============='
  AND body_html ~ 'Content-Transfer-Encoding: base64';

-- Clean 7bit/plain-text MIME content (HTML is already decoded, just needs wrapping stripped)
UPDATE emails
SET
  body_html = regexp_replace(
    regexp_replace(
      substring(body_html from E'\n\n(.*)$'),
      E'\n--.*$', '', 'n'
    ),
    E'^\\s*', '', ''
  ),
  body_text = NULL
WHERE body_html ~ '^--==============='
  AND body_html ~ 'Content-Transfer-Encoding: 7bit';

-- Report
SELECT 
  (SELECT COUNT(*) FROM emails WHERE body_html ~ '^--===============') AS still_corrupt,
  (SELECT COUNT(*) FROM emails WHERE body_html IS NOT NULL AND body_html !~ '^--===============') AS clean_emails;
