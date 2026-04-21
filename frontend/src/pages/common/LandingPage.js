import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  BarChart3, 
  Target, 
  Smartphone, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import './LandingPage.css';

// 🌿 Import Institutional Assets
import tabletTech from '../../assets/landing/scout_tablet_tech_1776495616907.png';
import badgeAward from '../../assets/landing/badge_closeup_award_1776495640010.png';
import traditionEval from '../../assets/landing/scout_tradition_eval_1776495791429.png';
import ceremonyFeedback from '../../assets/landing/scout_ceremony_feedback_1776495824723.png';
import fieldScoring from '../../assets/landing/scout_field_scoring_1776495846577.png';

const LandingPage = () => {
  return (
    <div className="landing-container">
      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="nav-logo">
          SCOUT<span>PMS</span>
        </div>
        <div className="nav-links">
          <a href="#about">About us</a>
          <a href="#services">Our services</a>
          <Link to="/portal" className="nav-btn">Get Started</Link>
        </div>
      </nav>

      {/* ── Hero Section ────────────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-tagline">A Solution for Scouts</span>
          <h1>Transforming how Sri Lankan Scouts track progress</h1>
          <p>
            Our Scout Performance Management System streamlines registration, badge tracking, 
            and real-time approvals for scouts, leaders, and examiners across the district.
          </p>
          <div className="hero-btns">
            <Link to="/portal" className="btn-primary">Get Started</Link>
            <a href="#contact" className="btn-secondary">Contact Us</a>
          </div>
        </div>
      </section>

      {/* ── About Section ──────────────────────────────────────────────────── */}
      <section id="about" className="about-section">
        <div className="about-image">
          <img src={tabletTech} alt="Empowering Scouts" />
        </div>
        <div className="about-text">
          <span className="section-label">Our Mission</span>
          <h2>Empowering Scouts through Technology</h2>
          <p>
            We believe that every scout deserve a platform that reflects their achievements in 
            real-time. By digitizing merit badges and service hour tracking, we foster a 
            community of transparency, efficiency, and pride in the scout journey.
          </p>
          <Link to="/portal" className="btn-primary">Learn More <ChevronRight size={18} style={{ marginLeft: '8px' }} /></Link>
        </div>
      </section>

      {/* ── Services Section ───────────────────────────────────────────────── */}
      <section id="services" className="services-section">
        <div className="services-header">
          <span className="section-label">What we offer</span>
          <h2>Our Best Services For You</h2>
          <p>We provide a comprehensive digital ecosystem designed to meet the rigorous standards of the Sri Lanka Scout Association.</p>
        </div>
        
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon"><Smartphone size={24} /></div>
            <h3>User-Friendly Interface</h3>
            <p>Designed for mobile and desktop, ensuring scouts can upload proof from the field or home.</p>
          </div>
          <div className="service-card">
            <div className="service-icon"><BarChart3 size={24} /></div>
            <h3>Comprehensive Analytics</h3>
            <p>Leaders can track troop progress with high-fidelity charts and automated reports.</p>
          </div>
          <div className="service-card">
            <div className="service-icon"><ShieldCheck size={24} /></div>
            <h3>Real-Time Updates</h3>
            <p>Socket-powered approvals ensure that achievements are reflected on dashboards instantly.</p>
          </div>
          <div className="service-card">
            <div className="service-icon"><Target size={24} /></div>
            <h3>Milestone Tracking</h3>
            <p>Automated evaluation for major awards, including the President's Scout Award.</p>
          </div>
        </div>
      </section>

      {/* ── Badge & Award Section ─────────────────────────────────────────── */}
      <section className="badge-section">
        <div className="badge-text">
          <span className="section-label">Real-Time Sync</span>
          <h2>Automated Badge Management</h2>
          <p>
            Our "Direct Pipeline" allows leaders to verify preparation classes and examiners 
            to grant final digital signatures instantly. No more paperwork, just progress.
          </p>
          <Link to="/portal" className="btn-primary" style={{ background: '#059669' }}>Learn More</Link>
        </div>
        <div className="badge-image">
          <img src={badgeAward} alt="Badge Management" />
        </div>
      </section>

      {/* ── Evaluation Section ────────────────────────────────────────────── */}
      <section className="eval-section">
        <div className="services-header">
          <span className="section-label">Evaluation System</span>
          <h2>President's Award Evaluation</h2>
          <p>Ensuring the highest standards for Sri Lankan Scouting's most prestigious achievement.</p>
        </div>

        <div className="eval-grid">
          <div className="eval-item">
            <div className="eval-img-wrapper">
              <img src={traditionEval} alt="Evaluation Criteria" />
            </div>
            <div className="eval-content">
              <h3>Evaluation Criteria</h3>
              <p>Transparent standards for badge mastery and community service requirements.</p>
            </div>
          </div>
          <div className="eval-item">
            <div className="eval-img-wrapper">
              <img src={ceremonyFeedback} alt="Feedback Mechanism" />
            </div>
            <div className="eval-content">
              <h3>Feedback Mechanism</h3>
              <p>Leaders and examiners provide direct, actionable feedback on every submission.</p>
            </div>
          </div>
          <div className="eval-item">
            <div className="eval-img-wrapper">
              <img src={fieldScoring} alt="Efficient Scoring" />
            </div>
            <div className="eval-content">
              <h3>Efficient Scoring</h3>
              <p>Automated point calculation ensures fairness and accuracy across all districts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer id="contact" className="landing-footer">
        <div className="footer-logo">
          SCOUT<span>PMS</span>
        </div>
        <div className="footer-copy">
          &copy; 2026 Sri Lankan Scout Performance Management System. Empowering Future Leaders.
        </div>
        <div className="nav-links">
          <a href="#"><ExternalLink size={18} /></a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
