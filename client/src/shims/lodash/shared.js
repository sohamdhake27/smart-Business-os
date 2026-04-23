export const isFunction = (value) => typeof value === 'function';
export const isNil = (value) => value == null;
export const isNumber = (value) => typeof value === 'number' && !Number.isNaN(value);
export const isString = (value) => typeof value === 'string';
export const isObject = (value) => value !== null && typeof value === 'object';
export const isBoolean = (value) => typeof value === 'boolean';
export const isNaNValue = (value) => Number.isNaN(value);
const toCollectionArray = (collection) => {
  if (Array.isArray(collection)) return collection;
  if (collection == null) return [];
  return Object.values(collection);
};
export const first = (array) => array?.[0];
export const last = (array) => array?.[array.length - 1];
export const max = (array) => array?.length ? Math.max(...array) : undefined;
export const min = (array) => array?.length ? Math.min(...array) : undefined;
export const some = (collection, predicate) => toCollectionArray(collection).some(predicate);
export const every = (collection, predicate) => toCollectionArray(collection).every(predicate);
export const find = (collection, predicate) => toCollectionArray(collection).find(predicate);
export const flatMap = (collection, iteratee) => toCollectionArray(collection).flatMap(iteratee);
export const range = (start, end, step = 1) => {
  const actualEnd = end === undefined ? start : end;
  const actualStart = end === undefined ? 0 : start;
  const values = [];
  for (let value = actualStart; value < actualEnd; value += step) values.push(value);
  return values;
};
export const upperFirst = (value = '') => value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
export const get = (object, path, defaultValue) => {
  const keys = Array.isArray(path) ? path : String(path).split('.');
  const result = keys.reduce((accumulator, key) => (accumulator == null ? undefined : accumulator[key]), object);
  return result === undefined ? defaultValue : result;
};
export const sortBy = (collection = [], iteratees = []) => {
  const normalized = Array.isArray(iteratees) ? iteratees : [iteratees];
  return [...toCollectionArray(collection)].sort((left, right) => {
    for (const iteratee of normalized) {
      const leftValue = isFunction(iteratee) ? iteratee(left) : get(left, iteratee);
      const rightValue = isFunction(iteratee) ? iteratee(right) : get(right, iteratee);
      if (leftValue < rightValue) return -1;
      if (leftValue > rightValue) return 1;
    }
    return 0;
  });
};
export const throttle = (fn) => {
  const throttled = (...args) => fn(...args);
  throttled.cancel = () => {};
  throttled.flush = () => {};
  return throttled;
};
export const omit = (object = {}, keys = []) => {
  const blacklist = new Set(Array.isArray(keys) ? keys : [keys]);
  return Object.fromEntries(Object.entries(object).filter(([key]) => !blacklist.has(key)));
};
export const sumBy = (collection = [], iteratee) => toCollectionArray(collection).reduce((sum, item) => {
  const value = isFunction(iteratee) ? iteratee(item) : get(item, iteratee, 0);
  return sum + (Number(value) || 0);
}, 0);
export const maxBy = (collection = [], iteratee) => {
  const values = toCollectionArray(collection);
  if (!values.length) return undefined;
  return values.reduce((best, item) => {
    const bestValue = isFunction(iteratee) ? iteratee(best) : get(best, iteratee);
    const itemValue = isFunction(iteratee) ? iteratee(item) : get(item, iteratee);
    return itemValue > bestValue ? item : best;
  });
};
export const minBy = (collection = [], iteratee) => {
  const values = toCollectionArray(collection);
  if (!values.length) return undefined;
  return values.reduce((best, item) => {
    const bestValue = isFunction(iteratee) ? iteratee(best) : get(best, iteratee);
    const itemValue = isFunction(iteratee) ? iteratee(item) : get(item, iteratee);
    return itemValue < bestValue ? item : best;
  });
};
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key);
  };
};
export const mapValues = (object = {}, iteratee) =>
  Object.fromEntries(Object.entries(object).map(([key, value]) => [key, iteratee(value, key)]));
export const uniqBy = (collection = [], iteratee) => {
  const seen = new Set();
  return toCollectionArray(collection).filter((item) => {
    const value = isFunction(iteratee) ? iteratee(item) : get(item, iteratee);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};
export const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';
export const isEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);
