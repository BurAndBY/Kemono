const { db } = require('./db');
const splitWithoutTruncation = (string, separator, n) => {
  var split = string.split(separator);
  if (split.length <= n)
      return split;
  var out = split.slice(0,n-1);
  out.push(split.slice(n-1).join(separator));
  return out;
}

/**
 * Converts a regular string into a booru-style query. Returns a Knex query builder object.
 * @constructor
 * @param {Object} str - The plain text that will be converted into a query.
 * @param {String} opts.order - (Optional) The column to sort against.
 * @param {String} opts.sort - (Optional) The direction to sort. (asc/desc)
 * @param {Object} opts.offset - (Optional) The amount of posts to skip.
 * @param {String} opts.limit - (Optional) The maximum amount of posts to return.
 */
const booruQueryFromString = (str, opts = {}) => {
  let query = db('booru_posts');
  let tags = str.replace(/\s\s+/g, ' ').trim().split(' ');
  let regtags = [];
  tags.map(tag => {
    if (!tag) return;
    if (!/:/.test(tag)) return regtags.push(tag);
    let [namespace, nametag] = splitWithoutTruncation(tag, ':', 2);
    const metatags = [
      'id',
      'user',
      'service',
      'added',
      'published',
      'edited',
      'rating'
    ];
    if (!metatags.includes(namespace.replace('-', ''))) return;
    let not = namespace.startsWith('-');
    let wildcard = nametag.endsWith('*');
    // handle dates (wildcards only)
    if (not && wildcard && ['added', 'published', 'edited'].includes(namespace.replace('-', ''))) {
      query.andWhereRaw(`NOT CAST(booru_posts.${namespace.replace('-', '')} AS VARCHAR) LIKE ?`, [nametag.replace('*', '%').replace('_', ' ')])
    } else if (!not && wildcard && ['added', 'published', 'edited'].includes(namespace.replace('-', ''))) {
      query.andWhereRaw(`CAST(booru_posts.${namespace.replace('-', '')} AS VARCHAR) LIKE ?`, [nametag.replace('*', '%').replace('_', ' ')])
    } else if (not && !wildcard && ['added', 'published', 'edited'].includes(namespace.replace('-', ''))) {
      query.andWhereRaw(`NOT CAST(booru_posts.${namespace.replace('-', '')} AS VARCHAR) = ?`, [nametag.replace('_', ' ')])
    } else if (['added', 'published', 'edited'].includes(namespace.replace('-', ''))) {
      query.andWhereRaw(`CAST(booru_posts.${namespace.replace('-', '')} AS VARCHAR) = ?`, [nametag.replace('_', ' ')])
    // not dates
    } else if (not && wildcard) {
      query.andWhereNot(namespace.replace('-', ''), 'ILIKE', nametag.replace('*', '%'))
    } else if (!not && wildcard) {
      query.andWhere(namespace, 'ILIKE', nametag.replace('*', '%'))
    } else if (not && !wildcard) {
      query.andWhereNot(namespace.replace('-', ''), '=', nametag)
    } else {
      query.andWhere(namespace, '=', nametag)
    }
  });
  if (regtags.length) query.andWhereRaw('to_tsvector(tags) @@ websearch_to_tsquery(?)', [regtags.join(' ')]);
  if (opts.order && opts.sort) query.orderBy(opts.order, opts.sort);
  if (opts.offset) query.offset(opts.offset);
  if (opts.limit) query.limit(opts.limit);
  return query;
}

module.exports = { booruQueryFromString };