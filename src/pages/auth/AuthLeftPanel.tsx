// Shared geometric art panel for every unauthenticated auth page (Login,
// ForgotPassword, ResetPassword) — extracted from Login.tsx so the three
// pages stay visually identical without triplicating this markup.
export function AuthLeftPanel() {
  return (
    <div className="login-left">
      <div className="geo-shape geo-shape-1" />
      <div className="geo-shape geo-shape-2" />
      <div className="geo-shape geo-shape-3" />
      <div className="geo-shape geo-shape-4" />
      <div className="geo-shape geo-shape-5" />
      <div className="geo-shape geo-shape-6" />

      <div className="login-left-content">
        <h1>
          <em>One platform,</em>
          <br />
          <strong>limitless Success</strong>
        </h1>
        <p>
          Decrease churn. Nail operational cadence. Grow revenue. But most of all, set up your customers for success!
        </p>
      </div>
    </div>
  );
}
