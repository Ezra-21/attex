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

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p style={{ margin: 0, fontFamily: T.fB, fontSize: 14, color: T.text3 }}>
            Last updated: {UPDATED}
          </p>
        </div>

        <div style={{ padding: '16px 20px', background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 40, fontFamily: T.fB, fontSize: 13.5, color: T.text2, lineHeight: 1.6 }}>
          By creating an account or using Focus ASTU CP Hub, you agree to these terms. Please read them carefully. This platform is operated by the Focus ASTU Competitive Programming Community.
        </div>

        <Section title="1. Eligibility">
          <p style={{ margin: 0 }}>Access to Focus ASTU CP Hub is restricted to current students and affiliated members of Adama Science and Technology University. Accounts are created by invitation or when public signup is enabled by an admin. You must be at least 16 years old to use this platform.</p>
        </Section>

        <Section title="2. Account Responsibilities">
          <Li>You are responsible for keeping your password secure and not sharing your account.</Li>
          <Li>You must provide accurate information when completing your profile.</Li>
          <Li>You may not create multiple accounts or impersonate another person.</Li>
          <Li>You must notify an admin if you suspect unauthorized access to your account.</Li>
        </Section>

        <Section title="3. Acceptable Use">
          <p style={{ margin: '0 0 12px' }}>You agree not to:</p>
          <Li>Upload, post, or share content that is abusive, harassing, or violates others' rights.</Li>
          <Li>Attempt to gain unauthorized access to other accounts or the platform's systems.</Li>
          <Li>Submit false or misleading data (e.g. fabricating submission results).</Li>
          <Li>Use the platform for any commercial purpose without explicit permission.</Li>
          <Li>Interfere with or disrupt the platform's infrastructure.</Li>
        </Section>

        <Section title="4. Content">
          <p style={{ margin: '0 0 12px' }}>By posting content (bios, editorials, announcements) on the platform you grant Focus ASTU CP Hub a non-exclusive license to display that content to other members. You retain ownership of your content.</p>
          <p style={{ margin: 0 }}>Admins may remove any content that violates these terms without prior notice.</p>
        </Section>

        <Section title="5. Competitive Integrity">
          <p style={{ margin: 0 }}>Contest standings, submission records, and leaderboards are used for community ranking. Any attempt to manipulate these records (including submitting solutions under someone else's handle or falsifying results) may result in immediate account suspension.</p>
        </Section>

        <Section title="6. Account Suspension">
          <p style={{ margin: 0 }}>Admins may suspend or terminate accounts that violate these terms, engage in misconduct, or are no longer affiliated with ASTU. Suspended users will be notified where reasonably possible.</p>
        </Section>

        <Section title="7. Disclaimer">
          <p style={{ margin: 0 }}>Focus ASTU CP Hub is provided "as is" for educational and community purposes. We do not guarantee uninterrupted availability. We are not responsible for any loss of data or disruption to your workflow caused by outages or errors.</p>
        </Section>

        <Section title="8. Changes to These Terms">
          <p style={{ margin: 0 }}>We may update these terms from time to time. Continued use of the platform after changes are posted constitutes acceptance of the revised terms.</p>
        </Section>

        <Section title="9. Contact">
          <p style={{ margin: 0 }}>Questions about these terms? Reach us at <a href="mailto:ayanasamuel8@gmail.com" style={{ color: T.accentText, textDecoration: 'none' }}>ayanasamuel8@gmail.com</a>.</p>
        </Section>

        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 24, display: 'flex', gap: 12 }}>
          <Btn kind="ghost" size="sm" onClick={() => navigate('/privacy')}>Privacy Policy →</Btn>
          <Btn kind="ghost" size="sm" onClick={() => navigate('/')}>Back to home</Btn>
        </div>
      </div>
    </div>
  );
}
