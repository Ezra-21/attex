import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { T } from '../../lib/tokens';
import { CodeBlock } from './CodeViewer';

interface MarkdownRendererProps {
  content: string;
  small?: boolean;
}

export function MarkdownRenderer({ content, small }: MarkdownRendererProps) {
  const fs = small ? 13 : 14.5;
  const hfs = small ? 15 : 18;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Suppress the default <pre> wrapper — code handles its own container
        pre: ({ children }) => <>{children}</>,

        h1: ({ children }) => (
          <h1 style={{ fontFamily: T.fD, fontSize: hfs + 6, fontWeight: 600, color: T.text, margin: '24px 0 12px', letterSpacing: -0.3 }}>
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 style={{ fontFamily: T.fD, fontSize: hfs + 2, fontWeight: 600, color: T.text, margin: '22px 0 10px', letterSpacing: -0.2 }}>
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 style={{ fontFamily: T.fD, fontSize: hfs, fontWeight: 600, color: T.text, margin: '20px 0 9px', letterSpacing: -0.2 }}>
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p style={{ fontFamily: T.fB, fontSize: fs, lineHeight: 1.65, color: T.text2, margin: '0 0 12px' }}>
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul style={{ margin: '0 0 14px', paddingLeft: 20, fontFamily: T.fB, fontSize: fs, lineHeight: 1.7, color: T.text2 }}>
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol style={{ margin: '0 0 14px', paddingLeft: 20, fontFamily: T.fB, fontSize: fs, lineHeight: 1.7, color: T.text2 }}>
            {children}
          </ol>
        ),
        strong: ({ children }) => (
          <strong style={{ color: T.text, fontWeight: 600 }}>{children}</strong>
        ),
        em: ({ children }) => (
          <em style={{ color: T.text2 }}>{children}</em>
        ),
        code: ({ children, className }) => {
          const raw = String(children);
          const code = raw.replace(/\n$/, '');
          // react-markdown v10: fenced code blocks always end with '\n';
          // inline code never does. Also handle explicitly-languaged blocks.
          const isBlock = !!className || raw.endsWith('\n');
          if (isBlock) {
            return (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}`, margin: '4px 0 16px' }}>
                <CodeBlock code={code} fontSize={small ? 11.5 : 12.5} />
              </div>
            );
          }
          // inline code
          return (
            <span className="mono" style={{
              fontSize: '0.88em', color: T.accentText,
              background: T.accentGhost, borderRadius: 4, padding: '1px 5px',
            }}>
              {children}
            </span>
          );
        },
        blockquote: ({ children }) => (
          <blockquote style={{
            borderLeft: `3px solid ${T.accentLine}`, margin: '0 0 14px',
            paddingLeft: 16, color: T.text2, fontStyle: 'italic',
          }}>
            {children}
          </blockquote>
        ),
        hr: () => <hr style={{ border: 'none', borderTop: `1px solid ${T.border}`, margin: '20px 0' }} />,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer" style={{ color: T.accentText, textDecoration: 'underline' }}>
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
