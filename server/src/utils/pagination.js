/* Parses page/limit query params into skip/limit with sane bounds. */
export function paginate(query) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(query.limit || '12', 10)));
  return { page, limit, skip: (page - 1) * limit };
}

export const pageMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 1,
  hasMore: page * limit < total,
});
