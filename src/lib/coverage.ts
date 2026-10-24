export interface PressItem {
  date: string;
  outlet: string;
  headline: string;
  type: string;
  summary: string;
  url: string;
  status: string;
}

export const PRESS_SORTS = {
  newest: "Newest first",
  oldest: "Oldest first",
} as const;
export type PressSort = keyof typeof PRESS_SORTS;

export function parsePressItems(value: unknown): PressItem[] {
  if (!Array.isArray(value))
    throw new Error("Press archive must be a JSON array.");
  return value.map((row, index) => {
    const fields = [
      "date",
      "outlet",
      "headline",
      "type",
      "summary",
      "url",
      "status",
    ] as const;
    if (
      !row ||
      typeof row !== "object" ||
      fields.some((field) => typeof row[field] !== "string")
    ) {
      throw new Error(
        `Invalid press record ${index + 1}: all seven fields must be strings.`,
      );
    }
    if (row.url) {
      let url: URL;
      try {
        url = new URL(row.url);
      } catch {
        throw new Error(`Invalid URL in press record ${index + 1}.`);
      }
      if (
        !["https:", "http:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        /[\\\s\u0000-\u001f]/.test(row.url)
      ) {
        throw new Error(`Unsafe URL in press record ${index + 1}.`);
      }
    }
    return { ...row } as PressItem;
  });
}

function dateParts(value: string) {
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  if (month && (+month < 1 || +month > 12)) return null;
  if (
    day &&
    (+day < 1 || +day > new Date(Date.UTC(+year, +month, 0)).getUTCDate())
  )
    return null;
  return { year, month, day };
}

export function pressYear(date: string): string | null {
  return dateParts(date)?.year ?? null;
}

export function pressDateLabel(date: string): string {
  const parts = dateParts(date);
  if (!parts || !parts.month) return date;
  const month = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][+parts.month - 1];
  return parts.day
    ? `${month} ${+parts.day}, ${parts.year}`
    : `${month} ${parts.year}`;
}

export function pressTypes(items: readonly PressItem[]): string[] {
  return [...new Set(items.map((item) => item.type))].sort((a, b) =>
    a.localeCompare(b, "en"),
  );
}

export function pressStats(items: readonly PressItem[]) {
  const years = items
    .map((item) => pressYear(item.date))
    .filter((year): year is string => year !== null)
    .sort();
  return {
    total: items.length,
    outlets: new Set(items.map((item) => item.outlet)).size,
    years: years.length
      ? years[0] === years.at(-1)
        ? years[0]
        : `${years[0]}–${years.at(-1)}`
      : "",
  };
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function selectPress(
  items: readonly PressItem[],
  query: string,
  type: string,
  sort: PressSort,
) {
  const words = normalize(query.trim()).split(/\s+/).filter(Boolean);
  return items
    .filter((item) => {
      const text = normalize(`${item.outlet} ${item.headline} ${item.summary}`);
      return (
        (!type || item.type === type) &&
        words.every((word) => text.includes(word))
      );
    })
    .sort((a, b) => {
      const ay = pressYear(a.date),
        by = pressYear(b.date);
      if (!ay || !by) return ay ? -1 : by ? 1 : 0;
      if (ay !== by)
        return sort === "oldest" ? ay.localeCompare(by) : by.localeCompare(ay);
      return b.date.localeCompare(a.date);
    });
}

export function groupPressByYear(items: readonly PressItem[]) {
  const groups = new Map<string, PressItem[]>();
  for (const item of items) {
    const year = pressYear(item.date) ?? "Undated";
    const group = groups.get(year) ?? [];
    group.push(item);
    groups.set(year, group);
  }
  return [...groups].map(([year, entries]) => ({ year, entries }));
}
