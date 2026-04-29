import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../lib/tokens';
import type { Role } from '../../lib/tokens';
import { AppShell } from '../../components/layout/AppShell';
import { Icon } from '../../components/ui/Icon';
import { Avatar } from '../../components/ui/Avatar';
import { RoleBadge, SquadBadge } from '../../components/ui/Badge';
import { useAppUser } from '../../hooks/useAppUser';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';
import { useAllUsers } from './useUsersData';
import { useSquads } from '../admin/useAdminData';

export default function UsersPage() {
  const appUser  = useAppUser();
  const navigate = useNavigate();
  const w        = useWindowWidth();
  const isMobile = w < BREAKPOINTS.mobile;

  const [search, setSearch]     = useState('');
  const [squadFilter, setSquad] = useState<string>('ALL');

  const { data: users = [],  isLoading } = useAllUsers();
  const { data: squads = [] }            = useSquads();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (q && !u.full_name.toLowerCase().includes(q) && !u.codeforces_handle?.toLowerCase().includes(q)) return false;
      if (squadFilter !== 'ALL') {
        if (squadFilter === 'NONE' && u.squad_id !== null) return false;
        if (squadFilter !== 'NONE' && u.squad_id !== squadFilter) return false;
      }
      return true;
    });
  }, [users, search, squadFilter]);

  const inputStyle: React.CSSProperties = {
    flex: 1, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 9,
    padding: '9px 13px', outline: 'none', fontFamily: T.fB, fontSize: 13.5, color: T.text,
  };

  return (
    <AppShell
      title="Members"
      crumbs="Hub / Members"
      userId={appUser.id}
      role={appUser.role}
      userName={appUser.fullName}
      squadName={appUser.squadName}
      scroll
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 220px', background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 13px' }}>
            <Icon name="search" size={14} style={{ color: T.text3, flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or CF handle…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: T.fB, fontSize: 13.5, color: T.text }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3, display: 'grid', placeItems: 'center' }}>
                <Icon name="ban" size={13} />
              </button>
            )}
          </div>
          <select
            value={squadFilter}
            onChange={(e) => setSquad(e.target.value)}
            style={{ ...inputStyle, flex: '0 1 180px', cursor: 'pointer' }}
          >
            <option value="ALL">All squads</option>
            <option value="NONE">No squad</option>
            {squads.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Count */}
        <div style={{ fontFamily: T.fM, fontSize: 11, color: T.text3, marginBottom: 14, letterSpacing: 0.5 }}>
          {isLoading ? 'Loading…' : `${filtered.length} member${filtered.length !== 1 ? 's' : ''}`}
        </div>

        {/* List */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
          {isLoading ? (
            [1,2,3,4,5].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderTop: i > 1 ? `1px solid ${T.borderSoft}` : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.surface3 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ width: 140, height: 13, borderRadius: 6, background: T.surface3 }} />
                  <div style={{ width: 80, height: 10, borderRadius: 6, background: T.surface3 }} />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', fontFamily: T.fB, fontSize: 14, color: T.text3 }}>
              No members match your filters.
            </div>
          ) : (
            filtered.map((u, i) => (
              <div
                key={u.id}
                onClick={() => navigate(`/profile/${u.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: isMobile ? '12px 14px' : '13px 18px',
                  borderTop: i ? `1px solid ${T.borderSoft}` : 'none',
                  cursor: 'pointer', transition: 'background .12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Avatar name={u.full_name} size={isMobile ? 32 : 38} ring={u.id === appUser.id} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: T.fD, fontSize: isMobile ? 13 : 14, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.full_name}
                    </span>
                    {u.id === appUser.id && (
                      <span style={{ fontFamily: T.fM, fontSize: 9.5, color: T.accentText, border: `1px solid ${T.accentLine}`, borderRadius: 4, padding: '1px 5px' }}>YOU</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <RoleBadge role={u.role as Role} size="sm" />
                    {u.squad_name && <SquadBadge squad={u.squad_name} lead={u.role === 'SQUAD_LEAD'} size="sm" />}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontFamily: T.fD, fontSize: isMobile ? 14 : 16, fontWeight: 600, color: T.text }}>{u.problem_count}</span>
                  <span style={{ fontFamily: T.fM, fontSize: 10, color: T.text3 }}>solves</span>
                </div>
                {!isMobile && (
                  <Icon name="chevron" size={15} style={{ color: T.text3, flexShrink: 0 }} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
