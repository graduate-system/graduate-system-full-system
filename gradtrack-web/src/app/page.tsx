import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

/* ── Verified Unsplash photo URLs ─────────────────────── */
const IMG = {
  heroGraduate:
    "https://images.unsplash.com/photo-1627556704290-2b1f5853ff78?auto=format&fit=crop&w=900&q=85",
  studentsGroup:
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80",
  lectureHall:
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1600&q=80",
  analyticsLaptop:
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=85",
  campus:
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1800&q=80",
  studyDesk:
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80",
  graduateGroup:
    "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1400&q=80",
  avatar1:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80",
  avatar2:
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80",
  avatar3:
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=200&h=200&q=80",
};

export default function HomePage() {
  return (
    <>
      {/* ── Navbar ─────────────────────────────────────── */}
      <header className="navbar">
        <div className="container navbar-inner">
          <Link href="/" className="navbar-brand">
            <div className="navbar-logo">MUST</div>
            <div className="navbar-title">
              <span>GradTrack Analytics</span>
              <span>Meru University of Science &amp; Technology</span>
            </div>
          </Link>
          <nav>
            <ul className="navbar-nav">
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#graduates">Stories</a></li>
              <li><a href="#trends">Trends</a></li>
              <li><Link href="/register" className="navbar-cta">Submit Data</Link></li>
              <li><Link href="/dashboard">Dashboard</Link></li>
              <li><ThemeToggle /></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero-inner">

          {/* Left text column */}
          <div>
            <div className="hero-badge">
              <span>🎓</span>
              <span>Meru University · Graduate Employability</span>
            </div>

            <h1>
              Unlock <span className="highlight">Graduate</span>{" "}
              Employability Insights
            </h1>

            <p className="hero-desc">
              A data-driven analytics platform tracking graduate employment
              trends, industry demand, and skill gaps across Kenyan and East
              African labour markets — built for MUST graduates, faculty, and
              career advisors.
            </p>

            <div className="hero-actions">
              <Link href="/register" className="btn-primary">🎓 I&apos;m a Graduate →</Link>
              <Link href="/dashboard" className="btn-outline">Committee Dashboard</Link>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>12,400+</strong>
                <span>Graduate Records</span>
              </div>
              <div className="hero-stat">
                <strong>87%</strong>
                <span>Employment Rate</span>
              </div>
              <div className="hero-stat">
                <strong>340+</strong>
                <span>Partner Employers</span>
              </div>
            </div>
          </div>

          {/* Right image column */}
          <div className="hero-img-col">
            <div className="hero-img-wrap">
              <Image
                src={IMG.heroGraduate}
                alt="MUST graduate holding degree certificate"
                width={480}
                height={580}
                className="hero-img"
                priority
              />
              {/* Floating stat cards */}
              <div className="hero-float-card hero-float-top">
                <span className="float-icon">🏅</span>
                <div>
                  <strong>Top Rated</strong>
                  <span>Career Analytics Platform</span>
                </div>
              </div>
              <div className="hero-float-card hero-float-bottom">
                <span className="float-icon">📈</span>
                <div>
                  <strong>+12% YoY</strong>
                  <span>Graduate Employment Growth</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll">
          <span>Scroll to explore</span>
          <div className="hero-scroll-line" />
        </div>
      </section>

      {/* ── Quote Band (wide students image) ───────────── */}
      <div className="quote-band">
        <div
          className="quote-band-bg"
          style={{ backgroundImage: `url(${IMG.studentsGroup})` }}
        />
        <div className="quote-band-overlay" />
        <div className="container quote-band-inner">
          <blockquote>
            <p>
              &ldquo;Education is the most powerful weapon which you can use to
              change the world — and data tells us how well that weapon is
              being sharpened.&rdquo;
            </p>
            <cite>— MUST Career Services Office</cite>
          </blockquote>
          <div className="quote-band-stats">
            {[
              { v: "18", l: "Degree Programmes" },
              { v: "6", l: "Faculties Covered" },
              { v: "2,400+", l: "Graduates Per Year" },
            ].map((s) => (
              <div key={s.l} className="qstat">
                <strong>{s.v}</strong>
                <span>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ───────────────────────────────────── */}
      <section id="features" className="section features-bg">
        <div className="container">
          <div className="section-header-centered">
            <span className="section-label">Platform Features</span>
            <h2 className="section-title">
              Everything you need to track{" "}
              <span className="accent">graduate success</span>
            </h2>
            <p className="section-desc">
              From raw graduate data to actionable labour-market intelligence —
              GradTrack gives MUST stakeholders a complete employability picture.
            </p>
          </div>

          <div className="features-grid">
            {[
              {
                icon: "📊",
                title: "Real-Time Employment Analytics",
                desc: "Monitor graduate employment rates, sector distributions, and salary benchmarks updated quarterly from verified employer data.",
              },
              {
                icon: "🗺️",
                title: "Geospatial Opportunity Mapping",
                desc: "Visualise where MUST graduates are working across Kenya and the region, helping students identify high-demand locations.",
              },
              {
                icon: "🔍",
                title: "Skill Gap Analysis",
                desc: "Compare competencies employers demand against what graduates offer, guiding curriculum improvements and career prep programmes.",
              },
              {
                icon: "📈",
                title: "Industry Demand Forecasting",
                desc: "AI-powered trend models predict which sectors and roles will grow, so students can make informed career choices early.",
              },
              {
                icon: "🎓",
                title: "Programme Performance Reports",
                desc: "Departmental dashboards show employment outcomes per academic programme, enabling evidence-based accreditation reporting.",
              },
              {
                icon: "🤝",
                title: "Employer Partnership Hub",
                desc: "Connect MUST career services with 340+ vetted employers actively seeking MUST graduates for internships and full-time roles.",
              },
            ].map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Band ─────────────────────────────────── */}
      <section className="stats-band">
        <div className="container">
          <div className="stats-grid">
            {[
              { value: "12,400+", label: "Graduate Profiles Tracked" },
              { value: "87%",     label: "6-Month Employment Rate" },
              { value: "340+",    label: "Partner Employers" },
              { value: "18",      label: "Degree Programmes Covered" },
            ].map((s, i, arr) => (
              <Fragment key={s.label}>
                <div className="stat-item">
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="stat-divider" />
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────── */}
      <section id="how-it-works" className="hiw-section">
        {/* Background image */}
        <div
          className="hiw-bg"
          style={{ backgroundImage: `url(${IMG.lectureHall})` }}
        />
        <div className="hiw-overlay" />

        <div className="container hiw-inner">
          <div className="section-header-centered">
            <span className="section-label" style={{ color: "#f5a623" }}>
              How It Works
            </span>
            <h2 className="section-title" style={{ color: "#fff" }}>
              From raw data to{" "}
              <span style={{ color: "#f5a623" }}>actionable insight</span>
            </h2>
            <p className="section-desc" style={{ color: "rgba(255,255,255,0.7)" }}>
              Four simple steps from graduation records to career intelligence.
            </p>
          </div>

          <div className="steps-grid">
            {[
              {
                n: "01",
                title: "Data Collection",
                desc: "Graduate records, employer surveys, and job-market feeds are ingested from verified sources automatically.",
              },
              {
                n: "02",
                title: "Processing & Analysis",
                desc: "Our analytics engine cleans, links, and enriches the data — mapping graduates to outcomes and skills to demand.",
              },
              {
                n: "03",
                title: "Trend Modelling",
                desc: "Machine-learning models surface employment trends, salary benchmarks, and skill-gap forecasts by sector.",
              },
              {
                n: "04",
                title: "Interactive Dashboards",
                desc: "Stakeholders access role-tailored views — student, faculty, career advisor, and employer — each with relevant KPIs.",
              },
            ].map((s) => (
              <div key={s.n} className="step-card step-card-dark">
                <div className="step-number">{s.n}</div>
                <h3 style={{ color: "#fff" }}>{s.title}</h3>
                <p style={{ color: "rgba(255,255,255,0.65)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Graduate Testimonials ───────────────────────── */}
      <section id="graduates" className="section features-bg">
        <div className="container">
          <div className="section-header-centered">
            <span className="section-label">Graduate Stories</span>
            <h2 className="section-title">
              Hear from <span className="accent">our alumni</span>
            </h2>
            <p className="section-desc">
              MUST graduates using GradTrack to navigate their career journeys
              across Kenya and East Africa.
            </p>
          </div>

          <div className="testimonials-grid">
            {[
              {
                img: IMG.avatar1,
                name: "Brian Mutua",
                prog: "BSc Computer Science, 2023",
                employer: "Software Engineer · Safaricom",
                quote:
                  "GradTrack showed me data engineering was the fastest-growing role for CS graduates. I targeted that niche and landed my dream job within three months of graduating.",
              },
              {
                img: IMG.avatar2,
                name: "Grace Wanjiku",
                prog: "BSc Public Health, 2022",
                employer: "Health Officer · County Gov't of Meru",
                quote:
                  "The geospatial map revealed that Meru County had the highest demand for public health officers. I applied locally and got hired before my classmates in Nairobi.",
              },
              {
                img: IMG.avatar3,
                name: "Samuel Njiru",
                prog: "BEng Civil Engineering, 2023",
                employer: "Site Engineer · China Wu Yi Co.",
                quote:
                  "The skill-gap analysis told me exactly which certifications would boost my employability. I got AutoCAD certified and received three job offers in one week.",
              },
            ].map((t) => (
              <div key={t.name} className="testimonial-card">
                <div className="testimonial-top">
                  <Image
                    src={t.img}
                    alt={t.name}
                    width={64}
                    height={64}
                    className="testimonial-avatar"
                  />
                  <div>
                    <strong className="testimonial-name">{t.name}</strong>
                    <span className="testimonial-prog">{t.prog}</span>
                  </div>
                </div>
                <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
                <div className="testimonial-employer">
                  <span>✅</span> {t.employer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trend Preview ───────────────────────────────── */}
      <section id="trends" className="section" style={{ background: "#fff" }}>
        <div className="container trends-inner">

          {/* Left – analytics image */}
          <div className="trends-img-col">
            <div className="trends-img-wrap">
              <Image
                src={IMG.analyticsLaptop}
                alt="Graduate employability analytics dashboard on laptop"
                width={520}
                height={400}
                className="trends-img"
              />
              <div className="trends-img-badge">
                <span>📊</span>
                <span>Live market data · Updated weekly</span>
              </div>
            </div>
          </div>

          {/* Right – trend cards */}
          <div>
            <span className="section-label">Live Trend Snapshot</span>
            <h2 className="section-title">
              Most in-demand roles for{" "}
              <span className="accent">MUST graduates</span>
            </h2>
            <p className="section-desc">
              Updated weekly from 340+ employer partners and national job
              boards. Filter by school, year, or county in the full dashboard.
            </p>

            <div className="trend-cards" style={{ marginTop: "1.8rem" }}>
              {[
                { rank: "#1", title: "Software / Data Engineer",      sector: "ICT", arrow: "up",   dir: "↑" },
                { rank: "#2", title: "Agricultural Extension Officer", sector: "Agriculture", arrow: "up", dir: "↑" },
                { rank: "#3", title: "Public Health Officer",         sector: "Health", arrow: "same", dir: "→" },
                { rank: "#4", title: "Civil / Structural Engineer",   sector: "Construction", arrow: "up", dir: "↑" },
                { rank: "#5", title: "Science Teacher (TSC)",         sector: "Education", arrow: "down", dir: "↓" },
              ].map((t) => (
                <div key={t.rank} className="trend-card">
                  <span className="trend-rank">{t.rank}</span>
                  <div className="trend-info">
                    <h4>{t.title}</h4>
                    <p>{t.sector}</p>
                  </div>
                  <span className={`trend-arrow ${t.arrow}`}>{t.dir}</span>
                </div>
              ))}
            </div>

            <Link href="/dashboard" className="btn-primary" style={{ marginTop: "1.8rem", display: "inline-flex" }}>
              View Full Dashboard →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Study Desk Split Section ─────────────────────── */}
      <section className="split-section">
        <div className="split-img-col">
          <Image
            src={IMG.studyDesk}
            alt="Graduate student working on career research"
            fill
            style={{ objectFit: "cover" }}
          />
          <div className="split-img-overlay" />
        </div>
        <div className="split-text-col">
          <span className="section-label">For Every Stakeholder</span>
          <h2 className="section-title">
            One platform,{" "}
            <span className="accent">four powerful views</span>
          </h2>
          <div className="split-roles">
            {[
              { icon: "🎓", role: "Students", desc: "Discover in-demand careers, salary expectations, and skills to build before graduation." },
              { icon: "📚", role: "Faculty & Deans", desc: "Measure programme employability outcomes and align curriculum with market needs." },
              { icon: "💼", role: "Career Advisors", desc: "Guide students with real data on employer demand, interview trends, and sector growth." },
              { icon: "🏢", role: "Employers", desc: "Post vacancies, review graduate profiles, and track talent pipelines from MUST." },
            ].map((r) => (
              <div key={r.role} className="split-role-item">
                <span className="split-role-icon">{r.icon}</span>
                <div>
                  <strong>{r.role}</strong>
                  <p>{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="cta-section">
        <div
          className="cta-bg"
          style={{ backgroundImage: `url(${IMG.campus})` }}
        />
        <div className="cta-overlay" />
        <div className="container cta-inner">
          <div className="cta-badge">🏫 Meru University of Science &amp; Technology</div>
          <h2>
            Ready to track your <span>graduate impact</span>?
          </h2>
          <p>
            Join MUST career services, academic departments, and partner
            employers already using GradTrack to close the employability gap.
          </p>
          {/* Role-based CTAs */}
          <div className="role-cta-grid">
            <div className="role-cta-card">
              <div className="role-cta-icon">🎓</div>
              <h3>I&apos;m a Graduate</h3>
              <p>Submit your employment details and help build MUST&apos;s employability profile.</p>
              <Link href="/register" className="btn-primary" style={{ marginTop: "auto" }}>
                Submit My Data →
              </Link>
            </div>
            <div className="role-cta-card">
              <div className="role-cta-icon">📊</div>
              <h3>School Committee</h3>
              <p>Access analytics dashboards, reports, and graduate outcome trends by programme.</p>
              <Link href="/dashboard" className="btn-outline" style={{ marginTop: "auto" }}>
                Open Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="navbar-brand" style={{ marginBottom: "0.5rem" }}>
                <div className="navbar-logo">MUST</div>
                <div className="navbar-title">
                  <span>GradTrack Analytics</span>
                  <span>Meru University of Science &amp; Technology</span>
                </div>
              </div>
              <p>
                Empowering graduates, faculty, and employers with data-driven
                insights into graduate employability across Kenya and the East
                African region.
              </p>
            </div>

            <div className="footer-col">
              <h4>Platform</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="#trends">Trend Reports</a></li>
                <li><Link href="/dashboard">Dashboard</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>University</h4>
              <ul>
                <li><a href="https://www.must.ac.ke" target="_blank" rel="noreferrer">MUST Website</a></li>
                <li><a href="https://www.must.ac.ke/academics/" target="_blank" rel="noreferrer">Academics</a></li>
                <li><a href="https://www.must.ac.ke/research/" target="_blank" rel="noreferrer">Research</a></li>
                <li><a href="mailto:info@must.ac.ke">Contact Us</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Resources</h4>
              <ul>
                <li><Link href="/register">Graduate Survey</Link></li>
                <li><Link href="/dashboard">Committee Portal</Link></li>
                <li><a href="mailto:ict@must.ac.ke">Contact ICT</a></li>
                <li><a href="https://www.must.ac.ke/privacy" target="_blank" rel="noreferrer">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} Meru University of Science &amp; Technology.
              All rights reserved.
            </span>
            <span>
              Built by{" "}
              <a href="https://www.must.ac.ke" target="_blank" rel="noreferrer">
                MUST ICT Dept.
              </a>
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
