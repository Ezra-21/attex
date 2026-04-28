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