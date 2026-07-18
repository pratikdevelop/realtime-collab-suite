import React, { useState } from 'react';

export default function LandingPage({ onGetStarted }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={styles.container}>
      {/* Decorative background elements */}
      <div style={styles.gridOverlay} />
      <div style={styles.glowOrb1} />
      <div style={styles.glowOrb2} />

      <div style={styles.content}>
        {/* Badge */}
        <div style={styles.badge}>
          <span style={styles.badgeDot} />
          WebRTC & SFU Secured Workspace
        </div>

        {/* Title */}
        <h1 style={styles.title}>
          Unified Collaboration
          <span style={styles.titleHighlight}> Suite</span>
        </h1>

        {/* Subtitle */}
        <p style={styles.subtitle}>
          Secure HD video calls, real‑time whiteboards, and high‑speed file sharing —
          <br />
          all over ultra‑low‑latency UDP data paths.
        </p>

        {/* Feature pills */}
        <div style={styles.features}>
          <span style={styles.featurePill}>📹 HD Video</span>
          <span style={styles.featurePill}>✏️ Whiteboard</span>
          <span style={styles.featurePill}>⚡ UDP Fast</span>
          <span style={styles.featurePill}>🔒 Encrypted</span>
        </div>

        {/* CTA Button */}
        <button
          onClick={onGetStarted}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            ...styles.ctaButton,
            ...(isHovered && styles.ctaButtonHover),
          }}
        >
          <span style={styles.ctaIcon}>🚀</span>
          Launch Portal
        </button>

        {/* Trust indicators */}
        <div style={styles.trust}>
          <span style={styles.trustItem}>✓ No account required</span>
          <span style={styles.trustItem}>✓ End‑to‑end encrypted</span>
          <span style={styles.trustItem}>✓ Open source</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#08080e',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    backgroundImage: `
      radial-gradient(ellipse at 20% 50%, #141425 0%, #08080e 70%),
      radial-gradient(ellipse at 80% 20%, #1a1a30 0%, transparent 60%)
    `,
    // padding: '2rem 1.5rem',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
  },

  // Subtle grid overlay for a "tech" feel
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
    pointerEvents: 'none',
    zIndex: 0,
  },

  glowOrb1: {
    position: 'absolute',
    top: '-20%',
    right: '-10%',
    width: '50vw',
    height: '50vw',
    maxWidth: '700px',
    maxHeight: '700px',
    background: 'radial-gradient(circle, rgba(31, 140, 249, 0.10) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 0,
  },

  glowOrb2: {
    position: 'absolute',
    bottom: '-20%',
    left: '-10%',
    width: '50vw',
    height: '50vw',
    maxWidth: '700px',
    maxHeight: '700px',
    background: 'radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 0,
  },

  content: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    maxWidth: '800px',
    width: '100%',
    padding: '1rem 0',
  },

  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.6rem',
    background: 'rgba(31, 140, 249, 0.08)',
    color: '#7bb8ff',
    border: '1px solid rgba(31, 140, 249, 0.15)',
    borderRadius: '100px',
    padding: '0.5rem 1.2rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
    marginBottom: '2rem',
    backdropFilter: 'blur(4px)',
  },

  badgeDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    backgroundColor: '#1f8cf9',
    borderRadius: '50%',
    boxShadow: '0 0 12px rgba(31, 140, 249, 0.5)',
    animation: 'pulse 2s infinite',
  },

  title: {
    fontSize: 'clamp(2.8rem, 10vw, 4.8rem)',
    fontWeight: 800,
    margin: '0 0 0.75rem 0',
    letterSpacing: '-0.03em',
    lineHeight: '1.08',
    color: '#ffffff',
  },

  titleHighlight: {
    background: 'linear-gradient(135deg, #1f8cf9 0%, #7c3aed 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },

  subtitle: {
    fontSize: 'clamp(1.05rem, 2.5vw, 1.3rem)',
    color: 'rgba(200, 200, 220, 0.85)',
    lineHeight: '1.7',
    maxWidth: '600px',
    margin: '0 auto 2.5rem auto',
    fontWeight: 400,
  },

  features: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '0.7rem',
    marginBottom: '2.8rem',
  },

  featurePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '0.45rem 1.2rem',
    borderRadius: '100px',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'rgba(220, 220, 240, 0.8)',
    letterSpacing: '0.2px',
    backdropFilter: 'blur(4px)',
    transition: 'background 0.2s, transform 0.2s',
  },

  ctaButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    padding: '1rem 3rem',
    fontSize: '1.15rem',
    fontWeight: 600,
    borderRadius: '60px',
    background: 'linear-gradient(135deg, #1f8cf9 0%, #2563eb 100%)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.25s ease, box-shadow 0.3s ease, background 0.3s ease',
    boxShadow: '0 4px 24px rgba(31, 140, 249, 0.35)',
    marginBottom: '2.5rem',
    minHeight: '60px',
    minWidth: '220px',
    position: 'relative',
    overflow: 'hidden',
  },

  ctaButtonHover: {
    transform: 'scale(1.05) translateY(-2px)',
    boxShadow: '0 12px 40px rgba(31, 140, 249, 0.5)',
    background: 'linear-gradient(135deg, #3b9aff 0%, #1f8cf9 100%)',
  },

  ctaIcon: {
    fontSize: '1.2rem',
  },

  trust: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '1.5rem 2.5rem',
    fontSize: '0.85rem',
    color: 'rgba(180, 180, 200, 0.6)',
    fontWeight: 400,
    letterSpacing: '0.2px',
  },

  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },

  // Responsive adjustments
  '@media (max-width: 640px)': {
    container: {
      padding: '1.5rem 1rem',
    },
    badge: {
      fontSize: '0.7rem',
      padding: '0.4rem 1rem',
    },
    features: {
      gap: '0.5rem',
    },
    featurePill: {
      fontSize: '0.8rem',
      padding: '0.3rem 0.9rem',
    },
    ctaButton: {
      padding: '0.8rem 2rem',
      fontSize: '1rem',
      minHeight: '50px',
      minWidth: '180px',
    },
    trust: {
      gap: '0.8rem 1.5rem',
      fontSize: '0.75rem',
    },
  },

  '@media (max-width: 420px)': {
    container: {
      padding: '1rem 0.75rem',
    },
    title: {
      fontSize: 'clamp(2.2rem, 14vw, 2.8rem)',
    },
    subtitle: {
      fontSize: '0.95rem',
    },
    trust: {
      flexDirection: 'column',
      gap: '0.5rem',
    },
  },
};

// Inject keyframe animation for the badge dot
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.4); }
    100% { opacity: 1; transform: scale(1); }
  }
`;
document.head.appendChild(styleSheet);