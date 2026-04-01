import { Link } from "react-router-dom";

export default function AuthPageLayout({ eyebrow, title, description, children }) {
  const showHeader = Boolean(title || description);

  return (
    <section className="auth-screen">
      <div className="container auth-container">
        <div className="auth-layout">
          <aside className="auth-brand-panel">
            <div className="auth-brand-top">
              <Link to="/" className="auth-brand-link">
                DataVista
              </Link>
              <span className="auth-brand-badge">Smart analytics platform</span>
            </div>

            <div className="auth-brand-copy">
              <h2>Turn raw data into visual insights.</h2>
              <p>
                A clean and secure analytics platform built for simple access and
                better data understanding.
              </p>
            </div>

            <div className="auth-brand-note">
              <span>Secure login</span>
              <span>Responsive design</span>
            </div>
          </aside>

          <div className="auth-form-panel">
            <div className="auth-card-shell">
              <div className="auth-card">
                {eyebrow ? (
                  <div className="auth-card-top">
                    <p className="auth-eyebrow">{eyebrow}</p>
                  </div>
                ) : null}

                {showHeader ? (
                  <div className="auth-card-header">
                    {title ? <h1 className="auth-title">{title}</h1> : null}
                    {description ? <p className="auth-description">{description}</p> : null}
                  </div>
                ) : null}

                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
