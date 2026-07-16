import assert from "node:assert/strict";
import {
  escapeHtml,
  escapeHtmlWithBreaks,
} from "../../client/src/lib/htmlEscape.ts";

const hostile = `<img src=x onerror="globalThis.pwned=1"> & 'registro'`;

assert.equal(
  escapeHtml(hostile),
  "&lt;img src=x onerror=&quot;globalThis.pwned=1&quot;&gt; &amp; &#39;registro&#39;",
);
assert.equal(escapeHtml(null), "");
assert.equal(escapeHtml(42), "42");
assert.equal(
  escapeHtmlWithBreaks("linha 1\n<script>alert(1)</script>\r\nlinha 3"),
  "linha 1<br>&lt;script&gt;alert(1)&lt;/script&gt;<br>linha 3",
);
assert.doesNotMatch(escapeHtmlWithBreaks(hostile), /<img|<script/i);

console.log("✓ templates imprimíveis escapam HTML clínico não confiável");
