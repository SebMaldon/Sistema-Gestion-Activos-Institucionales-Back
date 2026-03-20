export interface PaginationArgs {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
  totalCount: number;
}

export interface Connection<T> {
  edges: Array<{ node: T; cursor: string }>;
  pageInfo: PageInfo;
}

export function encodeCursor(id: string | number): string {
  return Buffer.from(String(id)).toString('base64');
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf-8');
}

export function buildPaginatedResponse<T extends { id_bien?: string; id_movimiento?: number; id_incidencia?: number; id_garantia?: number }>(
  items: T[],
  totalCount: number,
  args: PaginationArgs,
  idExtractor: (item: T) => string | number
): Connection<T> {
  const edges = items.map((node) => ({
    node,
    cursor: encodeCursor(idExtractor(node)),
  }));

  const first = args.first ?? 20;
  const hasNextPage = args.first ? items.length === first : false;
  const hasPreviousPage = !!args.after || !!args.before;

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage,
      startCursor: edges[0]?.cursor,
      endCursor: edges[edges.length - 1]?.cursor,
      totalCount,
    },
  };
}
