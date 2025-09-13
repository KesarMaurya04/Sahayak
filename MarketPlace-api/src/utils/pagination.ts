export function getPaging(q: any, defLimit = 20, maxLimit = 100) {
  const page = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(q.limit) || defLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}