import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Btn } from '../../components/ui/Btn';
import { Card } from '../../components/ui/Card';
import { CodeViewer } from '../../components/ui/CodeViewer';
import { T } from '../../lib/tokens';
import { TRACKS, LESSONS, DRILLS, QUIZZES, PATTERNS } from './catalog';
import { achievements } from './engine/achievements';
import { buildArena } from './engine/arena';
import { gradeCheck, gradeQuiz } from './engine/grade';
import { buildPlan } from './engine/planner';
import { markLesson, reviewCard, saveQuiz, solveDrill } from './engine/progress';
import { isDue } from './engine/review';
import { searchCatalog } from './engine/search';
import { BackLink, DIFF_COLOR, Pill, StudioFrame, StudioNav } from './frame';
import type { Check, Difficulty, Drill, Lesson } from './types';
import { useStudioProgress } from './useProgress';

function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

function drillById(id: string): Drill | undefined {
  return DRILLS.find((d) => d.id === id);
}

export function StudioHomePage() {
  const navigate = useNavigate();
  const [progress] = useStudioProgress();
  const [q, setQ] = useState('');
  const [track, setTrack] = useState('');
  const hits = useMemo(
    () => searchCatalog(LESSONS, DRILLS, { text: q, trackId: track, limit: 12 }),
    [q, track],
  );
  const done = Object.values(progress.lessons).filter((m) => m.done).length;
  return (
    <StudioFrame title="Studio" crumbs="Academy">
      <StudioNav />
      <h1 style={{ margin: '0 0 6px', fontFamily: T.fD, fontSize: 28, color: T.text }}>Training studio</h1>
      <p style={{ margin: '0 0 18px', color: T.text2, fontFamily: T.fB, lineHeight: 1.5 }}>
        Lessons, drills, quizzes, a weekly plan, spaced review, pattern cards, and a short mock arena. Progress stays in this browser.
      </p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Pill color={T.accentText}>{done} lessons done</Pill>
        <Pill>{LESSONS.length} lessons</Pill>
        <Pill>{DRILLS.length} drills</Pill>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search lessons and drills"
          style={inputStyle}
        />
        <select value={track} onChange={(e) => setTrack(e.target.value)} style={inputStyle}>
          <option value="">All tracks</option>
          {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>
      {q && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
          {hits.length === 0 && <p style={{ color: T.text3 }}>No matches.</p>}
          {hits.map((hit) => (
            <Card key={hit.kind + hit.id} pad={14}>
              <button onClick={() => navigate(hit.kind === 'lesson' ? `/studio/lessons/${hit.id}` : `/studio/drills/${hit.id}`)} style={linkBtn}>
                <strong>{hit.title}</strong>
                <span style={{ color: T.text3, marginLeft: 8 }}>{hit.kind}</span>
              </button>
              <div style={{ color: T.text2, fontSize: 13, marginTop: 4 }}>{hit.summary}</div>
            </Card>
          ))}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {TRACKS.map((t) => {
          const total = LESSONS.filter((l) => l.trackId === t.id).length;
          const finished = LESSONS.filter((l) => l.trackId === t.id && progress.lessons[l.id]?.done).length;
          return (
            <Card key={t.id}>
              <div style={{ fontFamily: T.fD, fontWeight: 650, color: T.text, marginBottom: 6 }}>{t.title}</div>
              <p style={{ margin: '0 0 10px', color: T.text2, fontSize: 13, lineHeight: 1.45 }}>{t.blurb}</p>
              <Pill color={T.accentText}>{finished}/{total} lessons</Pill>
            </Card>
          );
        })}
      </div>
    </StudioFrame>
  );
}

export function LessonPage() {
  const { lessonId = '' } = useParams();
  const lesson = lessonById(lessonId);
  const [progress, setProgress] = useStudioProgress();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [shown, setShown] = useState<Record<string, boolean>>({});
  if (!lesson) {
    return <StudioFrame title="Lesson" crumbs="Studio"><p style={{ color: T.text2 }}>That lesson is not in the catalog.</p></StudioFrame>;
  }
  const done = !!progress.lessons[lesson.id]?.done;
  return (
    <StudioFrame title={lesson.title} crumbs="Studio / Lesson">
      <BackLink to="/studio" label="Academy" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <Pill color={DIFF_COLOR[lesson.difficulty]}>{lesson.difficulty}</Pill>
        <Pill>{lesson.minutes} min</Pill>
        {lesson.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
      </div>
      <h1 style={{ margin: '0 0 8px', fontFamily: T.fD, color: T.text }}>{lesson.title}</h1>
      <p style={{ color: T.text2, lineHeight: 1.55 }}>{lesson.summary}</p>
      <ul style={{ color: T.text, lineHeight: 1.5 }}>
        {lesson.objectives.map((o) => <li key={o}>{o}</li>)}
      </ul>
      {lesson.sections.map((section) => (
        <Card key={section.heading} style={{ marginBottom: 12 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 16, color: T.text }}>{section.heading}</h2>
          <pre style={prose}>{section.body}</pre>
          {section.code && <CodeViewer code={section.code} lang={section.language || 'C++'} file={`${lesson.id}.cpp`} />}
        </Card>
      ))}
      <Card style={{ marginBottom: 12 }}>
        <h2 style={{ marginTop: 0, color: T.text, fontSize: 16 }}>Pitfalls</h2>
        <ul>{lesson.pitfalls.map((p) => <li key={p} style={{ color: T.text2, marginBottom: 6 }}>{p}</li>)}</ul>
      </Card>
      <Card>
        <h2 style={{ marginTop: 0, color: T.text, fontSize: 16 }}>Check yourself</h2>
        {lesson.checks.map((check) => (
          <CheckBox
            key={check.id}
            check={check}
            value={answers[check.id] ?? ''}
            revealed={!!shown[check.id]}
            onChange={(value) => setAnswers({ ...answers, [check.id]: value })}
            onReveal={() => setShown({ ...shown, [check.id]: true })}
          />
        ))}
        <div style={{ marginTop: 12 }}>
          <Btn kind={done ? 'ghost' : 'primary'} onClick={() => setProgress(markLesson(progress, lesson.id, !done))}>
            {done ? 'Mark as not done' : 'Mark lesson done'}
          </Btn>
        </div>
      </Card>
    </StudioFrame>
  );
}

function CheckBox({ check, value, revealed, onChange, onReveal }: {
  check: Check; value: string; revealed: boolean; onChange: (v: string) => void; onReveal: () => void;
}) {
  const ok = revealed && gradeCheck(check, value);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ color: T.text, marginBottom: 6 }}>{check.prompt}</div>
      {check.choices && check.choices.length > 0 ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
          <option value="">Choose</option>
          {check.choices.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} placeholder="Your answer" />
      )}
      <div style={{ marginTop: 8 }}>
        <Btn kind="ghost" size="sm" onClick={onReveal}>Check</Btn>
      </div>
      {revealed && (
        <p style={{ color: ok ? T.gain : T.loss, marginBottom: 0 }}>
          {ok ? 'Correct.' : 'Not quite.'} {check.explain}
        </p>
      )}
    </div>
  );
}

export function DrillListPage() {
  const navigate = useNavigate();
  const [progress] = useStudioProgress();
  const [track, setTrack] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const rows = DRILLS.filter((d) => (!track || d.trackId === track) && (!difficulty || d.difficulty === difficulty));
  return (
    <StudioFrame title="Drills" crumbs="Studio / Drills">
      <StudioNav />
      <Filters track={track} difficulty={difficulty} onTrack={setTrack} onDifficulty={setDifficulty} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((d) => (
          <Card key={d.id} pad={14}>
            <button onClick={() => navigate(`/studio/drills/${d.id}`)} style={linkBtn}>
              <strong>{d.title}</strong>
              {progress.drills[d.id]?.solved && <span style={{ color: T.gain, marginLeft: 8 }}>solved</span>}
            </button>
            <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
              <Pill color={DIFF_COLOR[d.difficulty]}>{d.difficulty}</Pill>
              <Pill>{d.minutes} min</Pill>
            </div>
          </Card>
        ))}
      </div>
    </StudioFrame>
  );
}

export function DrillPage() {
  const { drillId = '' } = useParams();
  const drill = drillById(drillId);
  const [progress, setProgress] = useStudioProgress();
  const [hint, setHint] = useState(false);
  const [solution, setSolution] = useState(false);
  if (!drill) return <StudioFrame title="Drill" crumbs="Studio"><p>Missing drill.</p></StudioFrame>;
  const solved = !!progress.drills[drill.id]?.solved;
  return (
    <StudioFrame title={drill.title} crumbs="Studio / Drill">
      <BackLink to="/studio/drills" label="Drills" />
      <h1 style={{ color: T.text, fontFamily: T.fD }}>{drill.title}</h1>
      <pre style={prose}>{drill.statement}</pre>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ color: T.text3, fontSize: 12 }}>Input</div>
        <pre style={prose}>{drill.inputFmt}</pre>
        <div style={{ color: T.text3, fontSize: 12 }}>Output</div>
        <pre style={prose}>{drill.outputFmt}</pre>
        <div style={{ color: T.text3, fontSize: 12 }}>Sample</div>
        <pre style={prose}>{drill.sampleIn}{'\n'}→ {drill.sampleOut}</pre>
      </Card>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Btn kind="ghost" onClick={() => setHint(true)}>Hint</Btn>
        <Btn kind="ghost" onClick={() => setSolution(true)}>Solution</Btn>
        <Btn kind="primary" onClick={() => setProgress(solveDrill(progress, drill.id, (hint ? 1 : 0) + (solution ? 1 : 0)))}>
          {solved ? 'Solved' : 'Mark solved'}
        </Btn>
      </div>
      {hint && <Card style={{ marginBottom: 12 }}><p style={{ margin: 0, color: T.text2 }}>{drill.hint}</p></Card>}
      {solution && <CodeViewer code={drill.solution} lang={drill.language} file={`${drill.id}.cpp`} />}
    </StudioFrame>
  );
}

export function QuizListPage() {
  const navigate = useNavigate();
  const [progress] = useStudioProgress();
  return (
    <StudioFrame title="Quizzes" crumbs="Studio / Quizzes">
      <StudioNav />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {QUIZZES.map((quiz) => {
          const saved = progress.quizzes[quiz.id];
          return (
            <Card key={quiz.id} pad={14}>
              <button onClick={() => navigate(`/studio/quizzes/${quiz.id}`)} style={linkBtn}><strong>{quiz.title}</strong></button>
              <div style={{ marginTop: 6 }}>
                <Pill>{quiz.questions.length} questions</Pill>
                {saved && <Pill color={saved.score === 100 ? T.gain : T.warn}>{saved.score}%</Pill>}
              </div>
            </Card>
          );
        })}
      </div>
    </StudioFrame>
  );
}

export function QuizPage() {
  const { quizId = '' } = useParams();
  const quiz = QUIZZES.find((q) => q.id === quizId);
  const [progress, setProgress] = useStudioProgress();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReturnType<typeof gradeQuiz> | null>(null);
  if (!quiz) return <StudioFrame title="Quiz" crumbs="Studio"><p>Missing quiz.</p></StudioFrame>;
  return (
    <StudioFrame title={quiz.title} crumbs="Studio / Quiz">
      <BackLink to="/studio/quizzes" label="Quizzes" />
      <h1 style={{ color: T.text, fontFamily: T.fD }}>{quiz.title}</h1>
      {quiz.questions.map((q, i) => (
        <Card key={q.id} style={{ marginBottom: 10 }}>
          <div style={{ color: T.text, marginBottom: 8 }}>{i + 1}. {q.prompt}</div>
          {q.choices && q.choices.length > 0 ? (
            q.choices.map((choice) => (
              <label key={choice} style={{ display: 'block', color: T.text2, marginBottom: 4 }}>
                <input type="radio" name={q.id} checked={answers[q.id] === choice} onChange={() => setAnswers({ ...answers, [q.id]: choice })} /> {choice}
              </label>
            ))
          ) : (
            <input value={answers[q.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} style={inputStyle} />
          )}
        </Card>
      ))}
      <Btn kind="primary" onClick={() => {
        const graded = gradeQuiz(quiz, answers);
        setResult(graded);
        setProgress(saveQuiz(progress, quiz.id, graded.correct, graded.total, graded.score));
      }}>Submit</Btn>
      {result && (
        <Card style={{ marginTop: 12 }}>
          <strong style={{ color: T.text }}>{result.correct}/{result.total} · {result.score}%</strong>
          {result.details.map((d) => (
            <p key={d.id} style={{ color: d.correct ? T.gain : T.loss }}>{d.correct ? 'Correct' : 'Review'}: {d.explain}</p>
          ))}
        </Card>
      )}
    </StudioFrame>
  );
}

export function PlanPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useStudioProgress();
  const [hours, setHours] = useState(4);
  const [picked, setPicked] = useState<string[]>([]);
  const [weak, setWeak] = useState('');
  const plan = useMemo(() => {
    const completed: Record<string, boolean> = {};
    for (const [id, mark] of Object.entries(progress.lessons)) completed[id] = mark.done;
    return buildPlan({
      hours, trackIds: picked, completed, weakTags: weak.split(',').map((s) => s.trim()).filter(Boolean), lessons: LESSONS,
    });
  }, [hours, picked, weak, progress]);
  return (
    <StudioFrame title="Study plan" crumbs="Studio / Plan">
      <StudioNav />
      <label style={{ color: T.text2 }}>Hours this week: {hours}</label>
      <input type="range" min={1} max={20} value={hours} onChange={(e) => setHours(Number(e.target.value))} style={{ width: '100%', margin: '8px 0 14px' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {TRACKS.map((t) => {
          const on = picked.includes(t.id);
          return (
            <button key={t.id} onClick={() => setPicked(on ? picked.filter((id) => id !== t.id) : [...picked, t.id])} style={{
              ...linkBtn, border: `1px solid ${on ? T.accentLine : T.border}`, borderRadius: 999, padding: '6px 10px',
              background: on ? T.accentGhost : 'transparent',
            }}>{t.title}</button>
          );
        })}
      </div>
      <input value={weak} onChange={(e) => setWeak(e.target.value)} placeholder="Weak tags, comma separated" style={{ ...inputStyle, marginBottom: 12 }} />
      <Btn kind="ghost" onClick={() => setProgress({ ...progress, plans: progress.plans + 1 })}>Save that I planned</Btn>
      <p style={{ color: T.text2 }}>{plan.totalMinutes} minutes · {plan.notes[0]}</p>
      {plan.items.map((item) => (
        <Card key={item.lessonId} pad={14} style={{ marginBottom: 8 }}>
          <button onClick={() => navigate(`/studio/lessons/${item.lessonId}`)} style={linkBtn}><strong>{item.title}</strong></button>
          <div style={{ color: T.text3, fontSize: 13 }}>{item.minutes} min — {item.reason}</div>
        </Card>
      ))}
    </StudioFrame>
  );
}

export function ReviewPage() {
  const [progress, setProgress] = useStudioProgress();
  const [quality, setQuality] = useState(4);
  const cards = useMemo(() => {
    const all: { id: string; prompt: string }[] = [];
    for (const lesson of LESSONS) {
      for (const check of lesson.checks) all.push({ id: `${lesson.id}:${check.id}`, prompt: `${lesson.title}: ${check.prompt}` });
    }
    const due = all.filter((c) => {
      const card = progress.cards[c.id];
      return !card || isDue(card);
    });
    return due.slice(0, 12);
  }, [progress]);
  const current = cards[0];
  return (
    <StudioFrame title="Review" crumbs="Studio / Review">
      <StudioNav />
      <p style={{ color: T.text2 }}>{cards.length} cards due. You have reviewed {progress.reviews}.</p>
      {current ? (
        <Card>
          <p style={{ color: T.text }}>{current.prompt}</p>
          <label style={{ color: T.text2 }}>Quality 0–5: {quality}</label>
          <input type="range" min={0} max={5} value={quality} onChange={(e) => setQuality(Number(e.target.value))} style={{ width: '100%' }} />
          <Btn kind="primary" onClick={() => setProgress(reviewCard(progress, current.id, quality))}>Grade and schedule</Btn>
        </Card>
      ) : <p style={{ color: T.gain }}>Nothing due. Open a lesson and the checks will land here next time.</p>}
    </StudioFrame>
  );
}

export function PatternPage() {
  const [track, setTrack] = useState('');
  const rows = PATTERNS.filter((p) => !track || p.trackId === track);
  return (
    <StudioFrame title="Patterns" crumbs="Studio / Patterns">
      <StudioNav />
      <select value={track} onChange={(e) => setTrack(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }}>
        <option value="">All tracks</option>
        {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
      </select>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {rows.map((p) => (
          <Card key={p.id}>
            <div style={{ fontFamily: T.fD, color: T.text, fontWeight: 650 }}>{p.title}</div>
            <p style={{ color: T.text2, fontSize: 13 }}>{p.idea}</p>
            <p style={{ color: T.text3, fontSize: 13 }}>When: {p.when}</p>
            <Pill>{p.complexity}</Pill>
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {p.signals.map((s) => <Pill key={s}>{s}</Pill>)}
            </div>
          </Card>
        ))}
      </div>
    </StudioFrame>
  );
}

export function ArenaPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useStudioProgress();
  const [count, setCount] = useState(3);
  const [track, setTrack] = useState('');
  const [seed, setSeed] = useState(7);
  const arena = useMemo(
    () => buildArena({ count, trackId: track, seed, drills: DRILLS }),
    [count, track, seed],
  );
  return (
    <StudioFrame title="Arena" crumbs="Studio / Arena">
      <StudioNav />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <label style={{ color: T.text2 }}>Problems
          <input type="number" min={1} max={8} value={count} onChange={(e) => setCount(Number(e.target.value))} style={{ ...inputStyle, width: 80, marginLeft: 8 }} />
        </label>
        <select value={track} onChange={(e) => setTrack(e.target.value)} style={inputStyle}>
          <option value="">Any track</option>
          {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        <Btn kind="ghost" onClick={() => setSeed(seed + 1)}>Reshuffle</Btn>
        <Btn kind="primary" onClick={() => setProgress({ ...progress, arenas: progress.arenas + 1 })}>Record this round</Btn>
      </div>
      <p style={{ color: T.text2 }}>{arena.title} · {arena.minutes} minutes · seed {arena.seed}</p>
      {arena.problems.map((p, i) => (
        <Card key={p.drillId} pad={14} style={{ marginBottom: 8 }}>
          <button onClick={() => navigate(`/studio/drills/${p.drillId}`)} style={linkBtn}>
            <strong>{i + 1}. {p.title}</strong>
          </button>
          <div style={{ marginTop: 6 }}><Pill>{p.points} pts</Pill> <Pill>{p.minutes} min</Pill></div>
        </Card>
      ))}
    </StudioFrame>
  );
}

export function BadgePage() {
  const [progress] = useStudioProgress();
  const badges = achievements(progress, LESSONS);
  return (
    <StudioFrame title="Badges" crumbs="Studio / Badges">
      <StudioNav />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {badges.map((b) => (
          <Card key={b.id} accent={b.earned}>
            <div style={{ fontFamily: T.fD, color: b.earned ? T.accentText : T.text, fontWeight: 650 }}>{b.title}</div>
            <p style={{ color: T.text2, fontSize: 13 }}>{b.description}</p>
            <Pill color={b.earned ? T.gain : T.text3}>{b.progress}/{b.goal}</Pill>
          </Card>
        ))}
      </div>
    </StudioFrame>
  );
}

function Filters({ track, difficulty, onTrack, onDifficulty }: {
  track: string; difficulty: Difficulty | ''; onTrack: (v: string) => void; onDifficulty: (v: Difficulty | '') => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <select value={track} onChange={(e) => onTrack(e.target.value)} style={inputStyle}>
        <option value="">All tracks</option>
        {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
      </select>
      <select value={difficulty} onChange={(e) => onDifficulty(e.target.value as Difficulty | '')} style={inputStyle}>
        <option value="">Any difficulty</option>
        <option value="intro">intro</option>
        <option value="core">core</option>
        <option value="advanced">advanced</option>
        <option value="contest">contest</option>
      </select>
    </div>
  );
}

const inputStyle: CSSProperties = {
  background: T.surface2, color: T.text, border: `1px solid ${T.border}`,
  borderRadius: 8, padding: '8px 10px', fontFamily: T.fB, fontSize: 14,
};

const linkBtn: CSSProperties = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  color: T.text, fontFamily: T.fD, fontSize: 15, textAlign: 'left',
};

const prose: CSSProperties = {
  whiteSpace: 'pre-wrap', fontFamily: T.fB, color: T.text2, lineHeight: 1.55, margin: '0 0 10px',
};
