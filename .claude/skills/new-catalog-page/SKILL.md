---
name: new-catalog-page
description: Add a new catalog page by replicating the patterns of this project. Follow the same conventions and use when adding a new comparison category or type of vendor.
model: sonnet
---
Read `src/app/textbooks/page.tsx` and `src/app/dorm/page.tsx` in full first. Then follow the pattern  in these files like the Seed type, the live curated fallback-function, the SuggestItemButton Modal standards and wiring, the object-contain-in-fixed-aspect-box image handling, the Live/Demo-data labeling exactly. After reading these files, run 
grep -rn "\"dorm\"" src supabase --include="*.ts" --include="*.tsx" --include="*.sql"
grep -rn "\"textbooks\"" src supabase --include="*.ts" --include="*.tsx" --include="*.sql" . Every file that hardcodes "dorm" and "textbooks" together needs the new page name added as well. 