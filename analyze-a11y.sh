#!/bin/bash

OUT_FILE="/tmp/a11y-report.txt"
> "$OUT_FILE"

# 1. Imagens sem alt
echo "=== Checking for images without alt text ===" >&2
grep -rn "<img" client/src --include="*.tsx" --include="*.jsx" 2>/dev/null | grep -v "alt=" | head -50 | while IFS=':' read file line content; do
  [[ "$file" == *"ui/"* ]] && continue
  echo "$file:$line | img-no-alt | img | Add alt=\"description\" attribute"
done >> "$OUT_FILE"

# 2. Botões sem texto ou aria-label
echo "=== Checking for buttons without labels ===" >&2
grep -rn "<button" client/src --include="*.tsx" --include="*.jsx" 2>/dev/null | grep -v "aria-label" | head -30 >> "$OUT_FILE"

# 3. Divs com onClick
echo "=== Checking for divs with onClick ===" >&2
grep -rn "onClick" client/src --include="*.tsx" --include="*.jsx" 2>/dev/null | grep "<div" | head -20 | while IFS=':' read file line content; do
  if [[ ! "$content" =~ "role=" ]]; then
    echo "$file:$line | div-onclick-no-role | div | Add role=\"button\" and keyboard handler"
  fi
done >> "$OUT_FILE"

# 4. Inputs sem label
echo "=== Checking for inputs without labels ===" >&2
grep -rn "<input\|<textarea\|<select" client/src --include="*.tsx" --include="*.jsx" 2>/dev/null | grep -v "aria-label\|id=" | grep -v "hidden" | head -40 >> "$OUT_FILE"

# 5. outline-none
echo "=== Checking for outline-none without focus-visible ===" >&2
grep -rn "outline-none" client/src --include="*.tsx" --include="*.jsx" 2>/dev/null | grep -v "focus-visible\|focus:ring" | head -20 >> "$OUT_FILE"

cat "$OUT_FILE" | head -100
echo ""
echo "Total lines: $(wc -l < $OUT_FILE)"
