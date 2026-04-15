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
        </div>
      )}

      {!isLoading && !submission && (
        <div style={{ textAlign: 'center', padding: 48, fontFamily: T.fB, fontSize: 15, color: T.text3 }}>
          Submission not found.
        </div>
      )}

      {submission && (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Problem header */}
          {problem && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
              <PlatformBadge p={problem.platform} full />
              <h1 style={{ margin: 0, fontFamily: T.fD, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: -0.5, flex: 1 }}>
                {problem.name}
              </h1>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {problem.tags.map((t) => (
                  <span key={t} style={{ fontFamily: T.fM, fontSize: 10.5, color: T.text2, background: T.surface3, border: `1px solid ${T.border}`, borderRadius: 5, padding: '2px 7px' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Submitter strip */}
          {author && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 16,
              flexWrap: 'wrap',
            }}>
              <Avatar name={author.full_name} size={38} ring={author.id === appUser.id} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: T.fD, fontSize: 14, fontWeight: 600, color: T.text }}>
                    {author.full_name}
                  </span>
                  <RoleBadge role={author.role as import('../../lib/tokens').Role} size="sm" />
                  {author.squad_name && <SquadBadge squad={author.squad_name} size="sm" />}
                </div>
                <div style={{ fontFamily: T.fM, fontSize: 11, color: T.text3, marginTop: 3 }}>
                  submitted {relTime(submission.submitted_at)} · via {submission.source}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
                <Meta label="Verdict"><Verdict>Accepted</Verdict></Meta>
                <Meta label="Language">
                  <span className="mono" style={{ fontSize: 13, color: T.text }}>{submission.language}</span>
                </Meta>
              </div>
            </div>
          )}

          {/* Code viewer */}
          <CodeViewer code={submission.code} lang={submission.language} file={fileName} />

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            {problem && (
              <Btn kind="ghost" icon="book" onClick={() => navigate(`/problems/${problem.id}/editorials`)}>
                Editorials
              </Btn>
            )}
            <Btn kind="ghost" icon="problems" onClick={() => navigate('/problems')}>
              All problems
            </Btn>
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: T.fM, fontSize: 11, color: T.text3 }}>
              No code execution — stored &amp; displayed only
            </span>
          </div>
        </div>
      )}
    </AppShell>
  );
}
