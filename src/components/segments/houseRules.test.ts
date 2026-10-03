import { describe, expect, it } from 'vitest';
import { houseRuleSuite } from '../../test/houseRules';

// Spec §3's house rules over the Segments components and pages.
const files = {
  ...(import.meta.glob('./*.tsx', { query: '?raw', eager: true, import: 'default' }) as Record<string, string>),
  ...(import.meta.glob('../../pages/segments/*.tsx', { query: '?raw', eager: true, import: 'default' }) as Record<string, string>),
};

houseRuleSuite('segments house rules', files);

const sources = Object.entries(files).filter(([file]) => !file.includes('.test.'));

// Style constants already proven 44px-compliant by the folders that define
// them (components/organizations/portfolio/styles.ts, filterParts.tsx), and
// already covered by their own house-rule suites. A Segments file reaching
// for one of these needs no touch-target class of its own.
const KNOWN_COMPLIANT = ['BUTTON', 'PRIMARY', 'QUIET', 'COLUMN_ICON_BUTTON', 'FILTER_SELECT'];
const TARGET = /\bmin-h-11\b|\bmin-w-11\b|\bh-11\b[^`'"]*\bw-11\b|\bw-11\b[^`'"]*\bh-11\b/;
const CONST = /\bconst ([A-Z][A-Z0-9_]*)\s*=\s*(`[^`]*`|'[^']*'|"[^"]*")/g;
const CONTROL_START = /<(button|select|textarea|input|Link)\b/g;

/** Every control tag's name and attribute text, scanning braces (not just
 *  the next `>`) so an `onClick={() => …}` arrow's own `>` does not end the
 *  tag early. */
function controlTags(source: string): { tag: string; attrs: string }[] {
  const tags: { tag: string; attrs: string }[] = [];
  for (const match of source.matchAll(CONTROL_START)) {
    const tag = match[1];
    const attrsStart = match.index + match[0].length;
    let depth = 0;
    let i = attrsStart;
    while (i < source.length) {
      const ch = source[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '>' && depth === 0) break;
      i++;
    }
    tags.push({ tag, attrs: source.slice(attrsStart, i) });
  }
  return tags;
}

/** The expression inside a tag's `className={...}`, balancing the braces a
 *  template literal's `${…}` opens (a plain regex stops at the first `}`).
 *  `null` when the tag has no className at all. */
function classExpression(attrs: string): string | null {
  const plain = /className="([^"]*)"/.exec(attrs);
  if (plain) return plain[1];
  const start = attrs.indexOf('className={');
  if (start === -1) return null;
  let depth = 1;
  let i = start + 'className={'.length;
  let out = '';
  while (i < attrs.length && depth > 0) {
    const ch = attrs[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) break;
    }
    out += ch;
    i++;
  }
  return out;
}

/** Every ALL_CAPS identifier referenced in an expression (a style constant
 *  or a `${…}` interpolation), ignoring the Tailwind classes around it. */
function identifiersIn(expression: string): string[] {
  return [...expression.matchAll(/\b[A-Z][A-Z0-9_]*\b/g)].map((match) => match[0]);
}

/** A file's own style constants that resolve to a 44px target, directly or
 *  by referencing an already-compliant one (fixed point: `SELECT` references
 *  `FILTER_SELECT`, so it is compliant without repeating the class). */
function localCompliance(source: string): Set<string> {
  const consts = [...source.matchAll(CONST)].map(([, name, value]) => [name, value] as const);
  const compliant = new Set(KNOWN_COMPLIANT);
  let grew = true;
  while (grew) {
    grew = false;
    for (const [name, value] of consts) {
      if (compliant.has(name)) continue;
      if (TARGET.test(value) || identifiersIn(value).some((id) => compliant.has(id))) {
        compliant.add(name);
        grew = true;
      }
    }
  }
  return compliant;
}

/** Every button, link, select and text control in `source` that reaches no
 *  44px touch target on phones, directly or through a compliant constant. A
 *  checkbox or radio's target is its wrapping label, not the box itself. */
function controlsMissingTarget(source: string): string[] {
  const compliant = localCompliance(source);
  const offenders: string[] = [];
  for (const { tag, attrs } of controlTags(source)) {
    if (tag === 'input' && /\btype=["'](checkbox|radio|hidden)["']/.test(attrs)) continue;
    const expression = classExpression(attrs);
    const compliesDirectly = expression !== null && (TARGET.test(expression) || identifiersIn(expression).some((id) => compliant.has(id)));
    if (!compliesDirectly) offenders.push(`<${tag} ${attrs.replace(/\s+/g, ' ').trim().slice(0, 80)}`);
  }
  return offenders;
}

describe('segments house rules beyond the shared suite', () => {
  it('lays every list out as rows, never a table or grid', () => {
    expect(sources.filter(([, source]) => /<table|role="(table|grid)"/.test(source)).map(([file]) => file)).toEqual([]);
  });

  it('hides every Lucide icon from screen readers', () => {
    const offenders: string[] = [];
    for (const [file, source] of sources) {
      const icons = [...source.matchAll(/import \{([^}]+)\} from 'lucide-react'/g)].flatMap((m) => m[1].split(',').map((name) => name.trim()).filter(Boolean));
      for (const icon of icons) {
        for (const use of source.matchAll(new RegExp(`<${icon}\\b[^>]*>`, 'g'))) {
          if (!use[0].includes('aria-hidden')) offenders.push(`${file}: ${use[0]}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  // Ruling G18: a 44px-target check for segments controls (buttons, links,
  // selects, text inputs and textareas), on top of the shared suite.
  it('gives every button, link, select and text control a 44px touch target on phones', () => {
    const offenders: string[] = [];
    for (const [file, source] of sources) {
      for (const bad of controlsMissingTarget(source)) offenders.push(`${file}: ${bad}`);
    }
    expect(offenders).toEqual([]);
  });
});
