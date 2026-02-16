import sanitizeHtml from "sanitize-html";

const richHtmlConfig: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "ul",
    "ol",
    "li",
    "strong",
    "em",
    "u",
    "s",
    "a",
    "code",
    "pre",
    "br",
    "hr",
    "span",
    "div",
    "img",
    "figure",
    "figcaption",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height", "loading", "class"],
    figure: ["class", "style"],
    figcaption: ["class", "style"],
    "*": ["style", "class"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel", "data"],
  allowedSchemesByTag: {
    img: ["http", "https", "data"],
  },
  allowProtocolRelative: false,
  allowedStyles: {
    "*": {
      "text-align": [/^left$/, /^center$/, /^right$/, /^justify$/],
    },
    img: {
      display: [/^block$/, /^inline$/, /^inline-block$/],
      float: [/^left$/, /^right$/, /^none$/],
      "margin-left": [/^auto$/, /^0$/, /^\d+px$/, /^\d+%$/],
      "margin-right": [/^auto$/, /^0$/, /^\d+px$/, /^\d+%$/],
      width: [/^\d+px$/, /^\d+%$/, /^auto$/],
      height: [/^\d+px$/, /^\d+%$/, /^auto$/],
      "max-width": [/^\d+px$/, /^\d+%$/, /^none$/],
    },
    figure: {
      "text-align": [/^left$/, /^center$/, /^right$/],
      float: [/^left$/, /^right$/, /^none$/],
      "margin-left": [/^auto$/, /^0$/, /^\d+px$/, /^\d+%$/],
      "margin-right": [/^auto$/, /^0$/, /^\d+px$/, /^\d+%$/],
    },
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow" }, true),
  },
  disallowedTagsMode: "discard",
};

export function sanitizeRichHtml(input: string): string {
  return sanitizeHtml(input, richHtmlConfig).trim();
}

export function sanitizePlainText(input: string): string {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

export function hasMeaningfulHtmlContent(value: string): boolean {
  const plainText = sanitizePlainText(value);
  if (plainText.length > 0) return true;
  return /<img\s/i.test(value);
}
