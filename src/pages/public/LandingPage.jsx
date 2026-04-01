import { Link } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import SiteFooter from "../../components/layout/SiteFooter";

export default function LandingPage() {
  const { auth } = useAuth();

  return (
    <>
      <main className="landing-page landing-page-orion" id="top">
        <section className="landing-hero">
          <div className="container">
            <div className="orion-board">
              <div className="orion-main-panel">
                <aside className="orion-sidebar">
                  <div className="orion-logo">DV</div>
                  <div className="orion-sidebar-stack">
                    <span className="orion-sidebar-icon active" />
                    <span className="orion-sidebar-icon" />
                    <span className="orion-sidebar-icon" />
                  </div>
                </aside>

                <div className="orion-content">
                  <div className="row g-4 align-items-center">
                    <div className="col-xl-6">
                      <section className="orion-hero-card">
                        <span className="hero-badge">Smart Data Analytics Platform</span>
                        <h1>Turn raw data into visual insights.</h1>
                        <p className="landing-lead">
                          DataVista helps you upload datasets, analyze records, and
                          understand results through a clean visual analytics experience.
                        </p>

                        <div className="hero-cta-group">
                          {auth?.user ? (
                            <div className="signed-in-banner">
                              Signed in as <strong>{auth.user.email}</strong>
                            </div>
                          ) : (
                            <>
                              <Link to="/login" className="btn btn-outline-secondary hero-secondary-btn">
                                Login
                              </Link>
                              <Link to="/register" className="btn hero-primary-btn">
                                Sign Up
                              </Link>
                            </>
                          )}
                        </div>
                      </section>
                    </div>

                    <div className="col-xl-6">
                      <div className="orion-side-stack simple-visual-stack">
                        <div className="floating-analytics-card abstract-design-card">
                          <div className="abstract-design" aria-hidden="true">
                            <span className="abstract-data-text">DATA</span>
                            <div className="abstract-orbit orbit-a" />
                            <div className="abstract-orbit orbit-b" />
                            <div className="abstract-glow" />
                            <div className="abstract-grid">
                              <span className="abstract-bar tall" />
                              <span className="abstract-bar medium" />
                              <span className="abstract-bar short" />
                              <span className="abstract-bar medium" />
                            </div>
                            <div className="abstract-node node-a" />
                            <div className="abstract-node node-b" />
                            <div className="abstract-node node-c" />
                          </div>
                        </div>

                        <div className="simple-insight-card">
                          <p className="preview-label mb-2">DataVista features</p>
                          <div className="simple-feature-list">
                            <div className="simple-feature-item">
                              <span className="country-dot green" />
                              <span>Dataset upload</span>
                            </div>
                            <div className="simple-feature-item">
                              <span className="country-dot violet" />
                              <span>Data analysis</span>
                            </div>
                            <div className="simple-feature-item">
                              <span className="country-dot pink" />
                              <span>Visual reports</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
