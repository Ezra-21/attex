import { useNavigate } from 'react-router-dom';
import { T } from '../../lib/tokens';
import { Btn } from '../../components/ui/Btn';

const UPDATED = 'June 8, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ margin: '0 0 12px', fontFamily: T.fD, fontSize: 17, fontWeight: 600, color: T.text, letterSpacing: -0.3 }}>
        {title}
      </h2>
      <div style={{ fontFamily: T.fB, fontSize: 14, color: T.text2, lineHeight: 1.75 }}>
        {children}
      </div>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
      <span style={{ color: T.accent, marginTop: 2, flexShrink: 0 }}>·</span>
      <span>{children}</span>
    </div>
  );
}

export default function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <div style={{ background: T.bg, minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>

        <Btn kind="ghost" size="sm" onClick={() => navigate(-1)} style={{ marginBottom: 32 }}>
          ← Back
        </Btn>

        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: T.fM, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: T.accentText, marginBottom: 10 }}>
            Legal
          </div>
          <h1 style={{ margin: '0 0 10px', fontFamily: T.fD, fontSize: 30, fontWeight: 700, color: T.text, letterSpacing: -0.5 }}>
            Privacy Policy
          </h1>
          <p style={{ margin: 0, fontFamily: T.fB, fontSize: 14, color: T.text3 }}>
            Last updated: {UPDATED}
          </p>
        </div>

        <div style={{ padding: '16px 20px', background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 40, fontFamily: T.fB, fontSize: 13.5, color: T.text2, lineHeight: 1.6 }}>
          Focus ASTU CP Hub is a private competitive programming platform for students of Adama Science and Technology University. This policy explains what data we collect, how we use it, and your rights.
        </div>

        <Section title="1. Data We Collect">
          <p style={{ margin: '0 0 12px' }}>When you create an account and use the platform, we collect:</p>
          <Li><strong style={{ color: T.text }}>Account information</strong> — your email address and password (stored securely via Supabase Auth).</Li>
          <Li><strong style={{ color: T.text }}>Profile information</strong> — full name, Telegram handle, competitive programming handles (Codeforces, LeetCode, AtCoder), LinkedIn URL, and bio that you provide voluntarily.</Li>
          <Li><strong style={{ color: T.text }}>Submission data</strong> — problem submissions synced via the browser extension, including problem name, verdict, language, and timestamp.</Li>
          <Li><strong style={{ color: T.text }}>Usage data</strong> — pages visited and features used within the platform, to improve the experience.</Li>
        </Section>

        <Section title="2. How We Use Your Data">
          <Li>Display your profile, submission history, and contest standings to other members of the platform.</Li>
          <Li>Match your Codeforces handle against contest standings to calculate scores.</Li>
          <Li>Send platform notifications (e.g. squad announcements) via Telegram if you opt in.</Li>
          <Li>Improve platform features based on aggregated usage patterns.</Li>
          <p style={{ margin: '12px 0 0' }}>We do <strong style={{ color: T.text }}>not</strong> sell, rent, or share your personal data with third parties for advertising or marketing purposes.</p>
        </Section>

        <Section title="3. Data Visibility">
          <p style={{ margin: '0 0 12px' }}>This is a members-only platform. Your profile and submissions are visible to other authenticated members. The following is public (no login required):</p>
          <Li>Announcements posted by admins.</Li>
          <p style={{ margin: '12px 0 0' }}>All other content (problems, contests, leaderboards, profiles) requires an active account.</p>
        </Section>

        <Section title="4. Browser Extension">
          <p style={{ margin: '0 0 12px' }}>If you use the Focus ASTU CP Hub browser extension:</p>
          <Li>The extension reads submission results from LeetCode and Codeforces pages only when you submit a solution.</Li>
          <Li>Your API key is stored locally in your browser and sent only to this platform.</Li>
          <Li>No data is sent to any third party.</Li>
        </Section>

        <Section title="5. Data Retention">
          <p style={{ margin: 0 }}>Your data is retained for as long as your account is active. You may request account deletion by contacting an admin, after which your personal data will be removed within 30 days.</p>
        </Section>

        <Section title="6. Security">
          <p style={{ margin: 0 }}>Authentication is handled by Supabase, which uses industry-standard encryption. We do not store plaintext passwords. Access to the platform is restricted to approved members only.</p>
        </Section>

        <Section title="7. Contact">
          <p style={{ margin: 0 }}>For any privacy-related questions or requests, contact us at <a href="mailto:ayanasamuel8@gmail.com" style={{ color: T.accentText, textDecoration: 'none' }}>ayanasamuel8@gmail.com</a>.</p>
        </Section>

        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 24, display: 'flex', gap: 12 }}>
          <Btn kind="ghost" size="sm" onClick={() => navigate('/terms')}>Terms of Service →</Btn>
          <Btn kind="ghost" size="sm" onClick={() => navigate('/')}>Back to home</Btn>
        </div>
      </div>
    </div>
  );
}
