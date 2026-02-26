import { useState } from 'react';
import { T } from '../../lib/tokens';
import { Icon } from './Icon';

// ── Focus Teal theme (user choice) ────────────────────────────────────────
const THEME = {
  name: 'Focus Teal',
  bg: '#0c0f14', gutter: '#566', line: '#0e1219',
  kw: '#5fd0ff', fn: '#25d6c1', str: '#e3b341', num: '#ff9d6b',
  cmt: '#5a6472', type: '#a78bfa', punc: '#8a93a3', def: '#e9ebf0', op: '#7fd1c4',
};

const KW = new Set(
  'int long double float char bool void auto const static return if else for while do break continue struct class public private template typename using namespace include define vector string pair map set unordered_map unordered_set queue stack priority_queue sort cin cout endl push_back size begin end true false nullptr new delete sizeof typedef enum switch case default def import from as with lambda not and or in is None True False elif try except finally raise yield global print range len'.split(' ')
);
const TYPES = new Set('int long double float char bool void auto vector string pair map set queue stack size_t ll ull'.split(' '));

function tokenizeLine(line: string): Array<{ t: string; c: string }> {
  const out: Array<{ t: string; c: string }> = [];
  const re = /(\/\/.*$|#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+\.?\d*\b)|([A-Za-z_]\w*)|(\s+)|([{}()[\];,.])|([+\-*/%=<>!&|:?~^]+)/g;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out.push({ t: line.slice(last, m.index), c: THEME.def });
    last = re.lastIndex;
    if (m[1])      out.push({ t: m[1], c: THEME.cmt });
    else if (m[2]) out.push({ t: m[2], c: THEME.str });
    else if (m[3]) out.push({ t: m[3], c: THEME.num });
    else if (m[4]) {
      const w = m[4];
      const afterParen = line.slice(re.lastIndex).match(/^\s*\(/);
      if (KW.has(w) && !TYPES.has(w)) out.push({ t: w, c: THEME.kw });
      else if (TYPES.has(w))          out.push({ t: w, c: THEME.type });
      else if (afterParen)            out.push({ t: w, c: THEME.fn });
      else                            out.push({ t: w, c: THEME.def });
    }
    else if (m[5]) out.push({ t: m[5], c: THEME.def });
    else if (m[6]) out.push({ t: m[6], c: THEME.punc });
    else if (m[7]) out.push({ t: m[7], c: THEME.op });
  }
  if (last < line.length) out.push({ t: line.slice(last), c: THEME.def });
  return out;
}

interface CodeBlockProps {
  code: string;
  startLine?: number;
  highlight?: number[];
  fontSize?: number;
  maxLines?: number;
}

export function CodeBlock({ code, startLine = 1, highlight = [], fontSize = 12.5, maxLines }: CodeBlockProps) {
  let lines = code.replace(/\t/g, '  ').split('\n');
  if (maxLines) lines = lines.slice(0, maxLines);
  return (
    <div className="mono" style={{ background: THEME.bg, fontSize, lineHeight: 1.65, overflow: 'hidden' }}>
      {lines.map((ln, i) => {
        const hl = highlight.includes(startLine + i);
        return (
          <div key={i} style={{
            display: 'flex',
            background: hl ? 'rgba(243,181,60,0.07)' : 'transparent',
            boxShadow: hl ? `inset 2px 0 0 ${THEME.kw}` : 'none',
          }}>
            <span style={{
              width: 44, flexShrink: 0, textAlign: 'right', padding: '0 14px 0 0',
              color: THEME.gutter, userSelect: 'none', background: THEME.line,
            }}>{startLine + i}</span>
            <code style={{ padding: '0 16px', whiteSpace: 'pre', flex: 1 }}>
              {tokenizeLine(ln).map((tok, j) => (
                <span key={j} style={{ color: tok.c }}>{tok.t}</span>
              ))}
            </code>
          </div>
        );
      })}
    </div>
  );
}

interface CodeViewerProps {
  code: string;
  lang?: string;
  file?: string;
  highlight?: number[];
  meta?: React.ReactNode;
}

export function CodeViewer({ code, lang = 'C++', file = 'solution.cpp', highlight = [], meta }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.border}`, background: THEME.bg }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        borderBottom: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ff5f56', '#ffbd2e', '#27c93f'].map((c) => (
            <span key={c} style={{ width: 10, height: 10, borderRadius: 5, background: c, opacity: 0.85 }} />
          ))}
        </div>
        <span className="mono" style={{ fontSize: 12, color: T.text2, marginLeft: 6 }}>{file}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {meta}
          <span className="mono" style={{ fontSize: 11, color: T.text3 }}>{lang}</span>
          <button
            onClick={handleCopy}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: T.surface3, border: `1px solid ${T.border}`,
              color: copied ? T.gain : T.text2, fontFamily: T.fM, fontSize: 11,
              padding: '4px 9px', borderRadius: 6, cursor: 'pointer',
            }}
          >
            <Icon name={copied ? 'check' : 'copy'} size={12} />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </span>
      </div>
      <CodeBlock code={code} highlight={highlight} />
    </div>
  );
}
