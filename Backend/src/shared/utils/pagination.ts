import { Model, Document, FilterQuery, QueryOptions } from 'mongoose';

export interface OffsetPaginationOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
}

export interface OffsetPaginationResult<T> {
  nodes: T[];
  totalCount: number;
  pageInfo: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    limit: number;
  };
}

export interface CursorPaginationOptions {
  first?: number;
  after?: string; // Base64 cursor
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CursorPaginationResult<T> {
  edges: Array<{
    node: T;
    cursor: string;
  }>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
}

export async function paginateOffset<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options: OffsetPaginationOptions = {}
): Promise<OffsetPaginationResult<T>> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 10)); // Cap limit at 100
  const skip = (page - 1) * limit;
  const sort = options.sort || { createdAt: -1 };

  // Always enforce deletedAt is null
  const queryFilter = { ...filter, deletedAt: null };

  const [nodes, totalCount] = await Promise.all([
    model.find(queryFilter).sort(sort).skip(skip).limit(limit).lean().exec() as unknown as T[],
    model.countDocuments(queryFilter)
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    nodes,
    totalCount,
    pageInfo: {
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      limit
    }
  };
}

export async function paginateCursor<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options: CursorPaginationOptions = {}
): Promise<CursorPaginationResult<T>> {
  const first = Math.max(1, Math.min(100, options.first || 10));
  const sortField = options.sortField || '_id';
  const sortOrder = options.sortOrder || 'asc';
  
  const queryFilter: FilterQuery<T> = { ...filter, deletedAt: null };
  const filterAny = queryFilter as any;

  if (options.after) {
    const decodedValue = Buffer.from(options.after, 'base64').toString('utf8');
    if (sortOrder === 'asc') {
      filterAny[sortField] = { $gt: decodedValue };
    } else {
      filterAny[sortField] = { $lt: decodedValue };
    }
  }

  const sortOptions: Record<string, 1 | -1> = {
    [sortField]: sortOrder === 'asc' ? 1 : -1
  };

  // Fetch + 1 item to determine hasNextPage
  const nodes = await model
    .find(queryFilter)
    .sort(sortOptions)
    .limit(first + 1)
    .lean()
    .exec() as unknown as T[];

  const hasNextPage = nodes.length > first;
  if (hasNextPage) {
    nodes.pop(); // Remove extra element
  }

  const edges = nodes.map((node) => {
    // Generate cursor based on the sortField
    const fieldValue = String((node as any)[sortField]);
    const cursor = Buffer.from(fieldValue).toString('base64');
    return {
      node,
      cursor
    };
  });

  const startCursor = edges.length > 0 ? edges[0].cursor : null;
  const endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage: !!options.after,
      startCursor,
      endCursor
    }
  };
}
