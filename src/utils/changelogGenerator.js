// APIWatch — Rule-based Changelog Generator
// 100% free. No API. No network. Runs entirely in the browser.

const BREAKING_TYPE_PAIRS = new Set([
  'number:string', 'string:number',
  'number:boolean', 'boolean:number',
  'string:boolean', 'boolean:string',
  'object:array', 'array:object',
  'number:null', 'string:null', 'boolean:null', 'object:null', 'array:null',
]);

function isBreaking(diff) {
  if (diff.type === 'removed') return true;
  if (diff.type === 'type_changed') {
    const pair = `${diff.oldType}:${diff.newType}`;
    return BREAKING_TYPE_PAIRS.has(pair);
  }
  return false;
}

function toSentenceCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function describeTypeChange(oldType, newType) {
  if (oldType === 'number' && newType === 'string') return 'integer → string (update all parseInt / Number() calls)';
  if (oldType === 'string' && newType === 'number') return 'string → number (remove any string operations on this field)';
  if (oldType === 'array'  && newType === 'object') return 'array → object (update iteration logic)';
  if (oldType === 'object' && newType === 'array')  return 'object → array (update property access to index access)';
  if (newType === 'null')   return `${oldType} → null (add null checks)`;
  if (oldType === 'null')   return `null → ${newType}`;
  return `${oldType} → ${newType}`;
}

function formatPath(path) {
  return `\`${path}\``;
}

/**
 * generateRuleBasedChangelog(diffs, summary)
 * Returns a Markdown string — structured, specific, no LLM needed.
 */
export function generateRuleBasedChangelog(diffs, summary) {
  if (!diffs || diffs.length === 0) {
    return '> No changes detected between the two payloads.';
  }

  const breaking    = diffs.filter(d => isBreaking(d));
  const nonBreaking = diffs.filter(d => !isBreaking(d));

  const added       = diffs.filter(d => d.type === 'added');
  const removed     = diffs.filter(d => d.type === 'removed');
  const changed     = diffs.filter(d => d.type === 'changed');
  const typeChanged = diffs.filter(d => d.type === 'type_changed');

  const lines = [];

  // ── Header ──────────────────────────────────────────────────────────────
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  lines.push(`## API Changelog — ${date}`);
  lines.push('');

  // ── Summary line ─────────────────────────────────────────────────────────
  const parts = [];
  if (summary.added)       parts.push(`${summary.added} field${summary.added > 1 ? 's' : ''} added`);
  if (summary.removed)     parts.push(`${summary.removed} field${summary.removed > 1 ? 's' : ''} removed`);
  if (summary.changed)     parts.push(`${summary.changed} value${summary.changed > 1 ? 's' : ''} changed`);
  if (summary.typeChanged) parts.push(`${summary.typeChanged} type change${summary.typeChanged > 1 ? 's' : ''}`);
  lines.push(`**${toSentenceCase(parts.join(', '))}.**`);

  if (breaking.length > 0) {
    lines.push(`> ⚠️ **${breaking.length} breaking change${breaking.length > 1 ? 's' : ''}** — review before deploying.`);
  } else {
    lines.push('> ✅ No breaking changes detected.');
  }
  lines.push('');

  // ── Breaking Changes ─────────────────────────────────────────────────────
  if (breaking.length > 0) {
    lines.push('### ⚠️ Breaking Changes');
    lines.push('');
    for (const d of breaking) {
      if (d.type === 'removed') {
        lines.push(`- **REMOVED** ${formatPath(d.path)} _(was ${d.oldType}: ${d.oldValue})_ — remove all references to this field.`);
      } else if (d.type === 'type_changed') {
        const desc = describeTypeChange(d.oldType, d.newType);
        lines.push(`- **TYPE BREAK** ${formatPath(d.path)} — ${desc}. Was ${d.oldValue}, now ${d.newValue}.`);
      }
    }
    lines.push('');
  }

  // ── Added Fields ─────────────────────────────────────────────────────────
  if (added.length > 0) {
    lines.push('### ✅ Added');
    lines.push('');
    for (const d of added) {
      lines.push(`- ${formatPath(d.path)} _(${d.newType})_ = ${d.newValue}`);
    }
    lines.push('');
  }

  // ── Changed Values ────────────────────────────────────────────────────────
  if (changed.length > 0) {
    lines.push('### 🔄 Changed Values');
    lines.push('');
    for (const d of changed) {
      lines.push(`- ${formatPath(d.path)} — ${d.oldValue} → ${d.newValue}`);
    }
    lines.push('');
  }

  // ── Non-breaking type changes ─────────────────────────────────────────────
  const softTypeChanges = typeChanged.filter(d => !isBreaking(d));
  if (softTypeChanges.length > 0) {
    lines.push('### ℹ️ Type Changes (non-breaking)');
    lines.push('');
    for (const d of softTypeChanges) {
      lines.push(`- ${formatPath(d.path)} — ${d.oldType} → ${d.newType}`);
    }
    lines.push('');
  }

  // ── Migration notes ───────────────────────────────────────────────────────
  const migrationNotes = [];

  const intToStr = typeChanged.filter(d => d.oldType === 'number' && d.newType === 'string');
  if (intToStr.length > 0) {
    migrationNotes.push(`Update all \`parseInt()\` or numeric comparisons on: ${intToStr.map(d => formatPath(d.path)).join(', ')}`);
  }

  const strToInt = typeChanged.filter(d => d.oldType === 'string' && d.newType === 'number');
  if (strToInt.length > 0) {
    migrationNotes.push(`Remove string operations (e.g. \`.trim()\`, template literals) on: ${strToInt.map(d => formatPath(d.path)).join(', ')}`);
  }

  const nulled = typeChanged.filter(d => d.newType === 'null');
  if (nulled.length > 0) {
    migrationNotes.push(`Add null checks before accessing: ${nulled.map(d => formatPath(d.path)).join(', ')}`);
  }

  if (removed.length > 0) {
    migrationNotes.push(`Search codebase for references to removed fields: ${removed.map(d => formatPath(d.path)).join(', ')}`);
  }

  if (migrationNotes.length > 0) {
    lines.push('### 🛠 Migration Notes');
    lines.push('');
    for (const note of migrationNotes) {
      lines.push(`- ${note}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
