// APIWatch — Diff Engine
// Pure JS utility. No React, no side effects.

export const DIFF_TYPES = {
  ADDED: 'added',
  REMOVED: 'removed',
  CHANGED: 'changed',
  TYPE_CHANGED: 'type_changed',
};

export function getType(val) {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}

export function fmtVal(val) {
  if (val === undefined) return '';
  if (val === null) return 'null';
  if (typeof val === 'string') return `"${val.length > 60 ? val.slice(0, 60) + '…' : val}"`;
  if (typeof val === 'object') return Array.isArray(val) ? `Array(${val.length})` : `Object(${Object.keys(val).length})`;
  return String(val);
}

function deepDiff(a, b, path = '', results = []) {
  const tA = getType(a);
  const tB = getType(b);

  if (tA !== tB) {
    results.push({
      path: path || '(root)', type: DIFF_TYPES.TYPE_CHANGED,
      oldValue: fmtVal(a), newValue: fmtVal(b), oldType: tA, newType: tB,
    });
    return results;
  }

  if (tA !== 'object' && tA !== 'array') {
    if (a !== b) results.push({
      path: path || '(root)', type: DIFF_TYPES.CHANGED,
      oldValue: fmtVal(a), newValue: fmtVal(b), oldType: tA, newType: tB,
    });
    return results;
  }

  if (tA === 'array') {
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i++) {
      const cp = `${path}[${i}]`;
      if (i >= a.length) results.push({ path: cp, type: DIFF_TYPES.ADDED, oldValue: undefined, newValue: fmtVal(b[i]), oldType: null, newType: getType(b[i]) });
      else if (i >= b.length) results.push({ path: cp, type: DIFF_TYPES.REMOVED, oldValue: fmtVal(a[i]), newValue: undefined, oldType: getType(a[i]), newType: null });
      else deepDiff(a[i], b[i], cp, results);
    }
    return results;
  }

  // Objects
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const cp = path ? `${path}.${k}` : k;
    const hA = Object.prototype.hasOwnProperty.call(a, k);
    const hB = Object.prototype.hasOwnProperty.call(b, k);
    if (!hA) results.push({ path: cp, type: DIFF_TYPES.ADDED, oldValue: undefined, newValue: fmtVal(b[k]), oldType: null, newType: getType(b[k]) });
    else if (!hB) results.push({ path: cp, type: DIFF_TYPES.REMOVED, oldValue: fmtVal(a[k]), newValue: undefined, oldType: getType(a[k]), newType: null });
    else deepDiff(a[k], b[k], cp, results);
  }
  return results;
}

export function computeDiff(strA, strB) {
  try {
    const a = typeof strA === 'string' ? JSON.parse(strA) : strA;
    const b = typeof strB === 'string' ? JSON.parse(strB) : strB;
    const diffs = deepDiff(a, b);
    return {
      diffs,
      error: null,
      summary: {
        added: diffs.filter(d => d.type === DIFF_TYPES.ADDED).length,
        removed: diffs.filter(d => d.type === DIFF_TYPES.REMOVED).length,
        changed: diffs.filter(d => d.type === DIFF_TYPES.CHANGED).length,
        typeChanged: diffs.filter(d => d.type === DIFF_TYPES.TYPE_CHANGED).length,
      },
    };
  } catch (e) {
    return { diffs: [], summary: null, error: e.message };
  }
}
