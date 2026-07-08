/**
 * Wrap bare URLs and emails in <a href="..."> for HTML export.
 * Usage:
 *   node scripts/linkify.mjs "text with linkedin.com/in/foo"
 *   node scripts/linkify.mjs --file workspace/applications/.../cv-v1.html
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const URL_WITH_SCHEME =
  /(?<![="'])(https?:\/\/[^\s<>"']+)/g;

const URL_WITHOUT_SCHEME =
  /(?<![="'/])(?<!\w@)((?:www\.)?(?:linkedin\.com|github\.com|gitlab\.com|bitbucket\.org)\/[^\s<>"']+)/gi;

const EMAIL =
  /(?<![="'])(?<!\w)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?![^<]*>)/g;

/**
 * @param {string} text
 * @returns {string}
 */
export function linkifyText(text) {
  if (!text || /<a\s/i.test(text)) {
    return text;
  }

  let out = text;

  out = out.replace(URL_WITH_SCHEME, (url) => {
    const clean = url.replace(/[.,;:)]+$/, "");
    const trailing = url.slice(clean.length);
    return `<a href="${clean}">${clean}</a>${trailing}`;
  });

  out = out.replace(URL_WITHOUT_SCHEME, (url) => {
    const clean = url.replace(/[.,;:)]+$/, "");
    const trailing = url.slice(clean.length);
    return `<a href="https://${clean}">${clean}</a>${trailing}`;
  });

  out = out.replace(EMAIL, (email) => `<a href="mailto:${email}">${email}</a>`);

  return out;
}

/**
 * Linkify text nodes in HTML body; skips style/script blocks.
 * @param {string} html
 * @returns {string}
 */
export function linkifyHtml(html) {
  const chunks = html.split(/(<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>)/gi);

  return chunks
    .map((chunk) => {
      if (/^<(style|script)/i.test(chunk)) {
        return chunk;
      }
      return chunk.replace(/>([^<]+)</g, (match, text) => {
        if (!text.trim() || /<a\s/i.test(text)) {
          return match;
        }
        return `>${linkifyText(text)}<`;
      });
    })
    .join("");
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: node scripts/linkify.mjs <text>");
    console.error("       node scripts/linkify.mjs --file <path.html> [--in-place]");
    process.exit(1);
  }

  if (args[0] === "--file") {
    const filePath = resolve(args[1]);
    const inPlace = args.includes("--in-place");
    const html = readFileSync(filePath, "utf-8");
    const linked = linkifyHtml(html);
    if (inPlace) {
      writeFileSync(filePath, linked, "utf-8");
      console.log(`Linkified in place: ${filePath}`);
    } else {
      process.stdout.write(linked);
    }
    return;
  }

  process.stdout.write(linkifyText(args.join(" ")));
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("linkify.mjs") ||
    resolve(process.argv[1]) === resolve(import.meta.url));
if (isMain) {
  main();
}
