import { useParams, useNavigate } from 'react-router-dom';
import { T } from '../../lib/tokens';
import { AppShell } from '../../components/layout/AppShell';
import { Btn } from '../../components/ui/Btn';
import { PlatformBadge, RoleBadge, SquadBadge, Verdict } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { CodeViewer } from '../../components/ui/CodeViewer';
import { useAppUser } from '../../hooks/useAppUser';
import { useSubmission, langToExt } from './useProblemData';

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontFamily: T.fM, fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3, marginBottom: 4 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

export default function SubmissionViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const appUser  = useAppUser();
  const { data: submission, isLoading } = useSubmission(id);

  if (appUser.isLoading) return null;

  const problem = submission?.problem;
  const author  = submission?.user;
  const ext     = langToExt(submission?.language ?? '');
  const fileName = problem
    ? `${problem.external_id.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`
    : `solution.${ext}`;

  return (
    <AppShell
      title="Submission"
      crumbs={`Problems${problem ? ` / ${problem.name}` : ''} / Submission`}
      userId={appUser.id}
      role={appUser.role}
      userName={appUser.fullName}
      squadName={appUser.squadName}
      headerRight={
        problem && (
          <Btn kind="ghost" size="sm" iconR="external" onClick={() => window.open(problem.external_link, '_blank')}>
            Open problem
          </Btn>
        )
      }
    >
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <div style={{ width: 28, height: 28, border: `2px solid ${T.border}`, borderTopColor: T.accent, borderRadius: '50%', animation: 'fa-spin 0.7s linear infinite' }} />