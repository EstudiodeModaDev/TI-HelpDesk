import type { StoredFileRecord } from "./types.ts";

const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "br",
  "div",
  "em",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
]);

const ALLOWED_ATTRIBUTES = new Set([
  "alt",
  "colspan",
  "href",
  "rel",
  "rowspan",
  "src",
  "target",
  "title",
]);

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripHtmlComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

function stripBlockedTags(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<meta\b[^>]*\/?>/gi, "")
    .replace(/<link\b[^>]*\/?>/gi, "")
    .replace(/<\/?o:p\b[^>]*>/gi, "");
}

function stripDisallowedTags(html: string): string {
  return html.replace(/<\/?([a-zA-Z0-9:_-]+)\b[^>]*>/g, (full, rawTagName) => {
    const tagName = String(rawTagName).toLowerCase().replace(/^.*:/, "");
    if (ALLOWED_TAGS.has(tagName)) {
      return full;
    }

    return "";
  });
}

function parseAllowedAttributes(rawAttributes: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const attributeRegex =
    /([^\s=/>]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  for (const match of rawAttributes.matchAll(attributeRegex)) {
    const rawName = match[1];
    const name = rawName.toLowerCase();
    const value = match[3] ?? match[4] ?? match[5] ?? "";

    if (
      name === "class" ||
      name === "style" ||
      name === "id" ||
      name.startsWith("data-") ||
      name.startsWith("aria-") ||
      name.startsWith("lang") ||
      name.startsWith("xmlns") ||
      name.startsWith("mso-")
    ) {
      continue;
    }

    if (!ALLOWED_ATTRIBUTES.has(name)) {
      continue;
    }

    attributes.set(name, value.trim());
  }

  return attributes;
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function sanitizeTagAttributes(html: string): string {
  return html.replace(/<([a-zA-Z0-9:_-]+)\b([^>]*)>/g, (full, rawTagName, rawAttrs) => {
    if (full.startsWith("</")) {
      return full;
    }

    const tagName = String(rawTagName).toLowerCase().replace(/^.*:/, "");
    if (!ALLOWED_TAGS.has(tagName)) {
      return "";
    }

    const isSelfClosing = /\/\s*>$/.test(full);
    const attributes = parseAllowedAttributes(String(rawAttrs));

    if (tagName === "a") {
      const href = attributes.get("href") ?? "";
      if (!href || /^javascript:/i.test(href)) {
        attributes.delete("href");
      } else {
        attributes.set("target", "_blank");
        attributes.set("rel", "noopener noreferrer");
      }
    }

    if (tagName === "img") {
      const src = attributes.get("src") ?? "";
      if (!src || /^cid:/i.test(src) || /^data:/i.test(src)) {
        return "";
      }
    }

    const renderedAttributes = [...attributes.entries()]
      .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
      .join("");

    return `<${tagName}${renderedAttributes}${isSelfClosing ? " /" : ""}>`;
  });
}

function collapseEmptyTextContainers(html: string): string {
  let output = html;
  let previous = "";

  while (output !== previous) {
    previous = output;
    output = output.replace(
      /<(p|div|span)\b[^>]*>\s*(?:&nbsp;|\s|<br\s*\/?>)*\s*<\/\1>/gi,
      "",
    );
  }

  return output;
}

export function replaceCidSources(
  html: string,
  inlineFilesByCid: Map<string, StoredFileRecord>,
): string {
  if (!html.trim()) {
    return html;
  }

  let output = html;
  for (const [cid, file] of inlineFilesByCid.entries()) {
    const escapedCid = cid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`src=(["'])cid:${escapedCid}\\1`, "gi");
    output = output.replace(regex, `src="${file.url.replaceAll('"', "&quot;")}"`);
  }

  return output;
}

export function sanitizeHtml(html: string): string {
  if (!html.trim()) {
    return "<p>(sin contenido)</p>";
  }

  const cleaned = collapseEmptyTextContainers(
    sanitizeTagAttributes(
      stripDisallowedTags(
        stripBlockedTags(
          stripHtmlComments(html),
        ),
      ),
    ),
  );
  const normalized = normalizeWhitespace(cleaned)
    .replace(/>\s+</g, "><")
    .trim();

  return normalized || "<p>(sin contenido)</p>";
}
