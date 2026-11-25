-- Data only, no schema change. The AI writer sometimes returned a line break escaped twice, which was saved as the
-- two characters `\` `n` (or `\r\n`, `\r`) instead of a line break; `AiService.ask` now unescapes every answer. This
-- turns the ones already saved into real line breaks. Approved pieces are included: only the line breaks change, not
-- a word the owner approved. chr(92) is the backslash, spelled out so no string escaping can change its meaning.
UPDATE marketing_content
SET body = replace(replace(replace(body,
             chr(92) || 'r' || chr(92) || 'n', chr(10)),
             chr(92) || 'n', chr(10)),
             chr(92) || 'r', chr(10)),
    title = replace(replace(replace(title,
             chr(92) || 'r' || chr(92) || 'n', chr(10)),
             chr(92) || 'n', chr(10)),
             chr(92) || 'r', chr(10))
WHERE strpos(body, chr(92) || 'n') > 0
   OR strpos(body, chr(92) || 'r') > 0
   OR strpos(coalesce(title, ''), chr(92) || 'n') > 0
   OR strpos(coalesce(title, ''), chr(92) || 'r') > 0;
