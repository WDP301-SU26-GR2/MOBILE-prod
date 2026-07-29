export async function collectAllPages<T extends { items?: unknown[]; total?: number }>(
  loadPage: (params: Record<string, unknown>) => Promise<T>,
  params: Record<string, unknown> = {},
  pageSize = 100,
) {
  const first = await loadPage({ ...params, limit: pageSize, offset: 0 });
  const firstItems = first?.items ?? [];
  const total = first?.total ?? firstItems.length;
  const offsets = Array.from({ length: Math.max(0, Math.ceil(total / pageSize) - 1) }, (_, index) => (index + 1) * pageSize);
  const rest = await Promise.all(offsets.map((offset) => loadPage({ ...params, limit: pageSize, offset })));
  return { ...first, items: [first, ...rest].flatMap((page) => page?.items ?? []) };
}

export async function collectAllOffsetPages<T extends { items?: unknown[] }>(
  loadPage: (params: Record<string, unknown>) => Promise<T>,
  params: Record<string, unknown> = {},
  pageSize = 100,
) {
  let offset = 0;
  let first: T | null = null;
  const items: unknown[] = [];
  while (offset < 100_000) {
    const page = await loadPage({ ...params, limit: pageSize, offset });
    first ??= page;
    const pageItems = page?.items ?? [];
    items.push(...pageItems);
    if (pageItems.length < pageSize) break;
    offset += pageSize;
  }
  return { ...(first ?? {}), items } as T & { items: unknown[] };
}
