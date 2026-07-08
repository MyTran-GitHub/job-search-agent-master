export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function normalizeCompany(name: string): string {
  return normalizeWhitespace(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeTitle(title: string): string {
  return normalizeWhitespace(title).toLowerCase();
}

export function slugify(text: string): string {
  return normalizeWhitespace(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function stripHtml(html: string): string {
  return normalizeWhitespace(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
  );
}

export function extractYearsFromText(text: string): number | null {
  const patterns = [
    /(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience/i,
    /minimum\s+(?:of\s+)?(\d+)\s+(?:years?|yrs?)/i,
    /at\s+least\s+(\d+)\s+(?:years?|yrs?)/i,
    /(\d+)\s*-\s*\d+\s+(?:years?|yrs?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return parseInt(match[1], 10);
    }
  }
  return null;
}

export function isEntryLevelTitle(title: string): boolean {
  const lower = title.toLowerCase();
  return (
    /\b(entry[- ]?level|junior|jr\.?|associate|new grad|graduate|intern)\b/i.test(
      lower
    ) && !/\b(senior|sr\.?|lead|principal|staff|director)\b/i.test(lower)
  );
}
