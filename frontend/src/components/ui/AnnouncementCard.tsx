import { T } from '../../lib/tokens';
import { SquadBadge } from './Badge';

interface AnnouncementCardProps {
  scope: 'GLOBAL' | 'SQUAD';
  title: string;
  excerpt: string;
  author: string;
  when: string;
  squad?: string;
  compact?: boolean;
}

export function AnnouncementCard({ scope, title, excerpt, author, when, squad, compact }: AnnouncementCardProps) {
  const global = scope === 'GLOBAL';
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: global ? T.surface2 : 'rgba(37,214,193,0.04)',
      border: `1px solid ${global ? T.border : T.accentLine}`,
      borderRadius: 13, padding: compact ? 14 : 18,
      position: 'relative', overflow: 'hidden',
    }}>
      {!global && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: T.accent,
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {global
          ? (
            <span style={{
              fontFamily: T.fM, fontSize: 10, letterSpacing: 1.5, color: T.text3,
              border: `1px solid ${T.border}`, borderRadius: 5, padding: '2px 7px',
            }}>GLOBAL</span>
          )
          : <SquadBadge squad={squad} size="sm" />
        }
        <span style={{ marginLeft: 'auto', fontFamily: T.fM, fontSize: 11, color: T.text3 }}>{when}</span>
      </div>
      <div style={{
        fontFamily: T.fD, fontSize: compact ? 14 : 15.5, fontWeight: 600,
        color: T.text, marginBottom: 6, letterSpacing: -0.2,
      }}>{title}</div>
      <div style={{ fontFamily: T.fB, fontSize: 13, color: T.text2, lineHeight: 1.5 }}>{excerpt}</div>
      <div style={{ fontFamily: T.fM, fontSize: 11, color: T.text3, marginTop: 12 }}>{author}</div>
    </div>
  );
}
