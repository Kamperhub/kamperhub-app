// No 'use client' is strictly necessary for a purely static HTML output,
// but it's harmless to leave it if preferred.

// REMOVED: import Link from 'next/link';
// REMOVED: import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh', // Simpler vh for full height
      padding: '1rem',
      backgroundColor: '#FAF8F1', // Your background color (from globals.css :root)
      color: '#333', // A default dark text color for contrast
      fontFamily: 'sans-serif', // Use a standard web-safe font
      textAlign: 'center',
      boxSizing: 'border-box' // Ensure padding doesn't affect height
    }}>
      {/* REMOVED: The incorrect <head> tag and its contents */}

      <div style={{ maxWidth: '600px', width: '100%' }}>
        {/* Main Error Icon (Example: a generic "x" in a circle, or a simple question mark) */}
        {/* Uses inline SVG directly */}
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#BC4749" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', display: 'block' }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>

        <h1 style={{ fontFamily: 'sans-serif', fontSize: '3.75rem', lineHeight: '1', color: '#BC4749', margin: '0 0 0.5rem' }}>
          404
        </h1>
        <h2 style={{ fontFamily: 'sans-serif', fontSize: '1.5rem', lineHeight: '2rem', color: '#386641', margin: '0.5rem 0 1.5rem' }}>
          Page Not Found
        </h2>
        <p style={{ color: '#525252', margin: '1.5rem auto' }}>
          Oops! It seems you've taken a wrong turn. The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ marginTop: '2rem' }}>
            {/* Using a simple <a> tag for maximum resilience */}
            <a href="/" style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                lineHeight: '1.25rem',
                fontWeight: '500',
                padding: '0.5rem 1rem',
                backgroundColor: '#386641', // Your primary color (from globals.css :root)
                color: '#F7F8F8', // Your primary foreground color (from globals.css :root)
                textDecoration: 'none',
                transition: 'background-color 0.2s', // Basic transition for hover effect
                border: 'none',
                cursor: 'pointer',
            }}
            // Simple hover effect using inline JavaScript
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2a4d31')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#386641')}
            >
                {/* Home Icon as inline SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Return to Dashboard
            </a>
        </div>
      </div>
    </div>
  );
}
