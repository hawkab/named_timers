export function makeId(prefix = 'id') {
  const random = crypto?.getRandomValues ? crypto.getRandomValues(new Uint32Array(2)) : [Date.now(), Math.random() * 1e9];
  return `${prefix}_${Array.from(random).map((part) => Number(part).toString(36)).join('_')}`;
}
