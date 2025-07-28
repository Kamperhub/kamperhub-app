'use client';

import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 200px)',
      padding: '1rem',
      backgroundColor: '#FAF8F1',
      color: '#333',
      fontFamily: "'Alegreya', serif",
      textAlign: 'center',
    }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#BC4749" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', display: 'block' }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
        <h1 style={{ fontFamily: "'Belleza', sans-serif", fontSize: '3.75rem', lineHeight: 1, color: '#BC4749' }}>
          404
        </h1>
        <h2 style={{ fontFamily: "'Belleza', sans-serif", fontSize: '1.5rem', lineHeight: '2rem', color: '#386641', marginTop: '0.5rem' }}>
          Page Not Found
        </h2>
        <p style={{ color: '#525252', marginTop: '1.5rem' }}>
          Oops! It seems you've taken a wrong turn. The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ marginTop: '2rem' }}>
            <Link href="/" passHref>
              <button style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                lineHeight: '1.25rem',
                fontWeight: '500',
                padding: '0.5rem 1rem',
                backgroundColor: '#386641',
                color: '#F7F8F8',
                textDecoration: 'none',
                transition: 'background-color 0.2s',
                border: 'none',
                cursor: 'pointer',
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Return to Dashboard
              </button>
            </Link>
        </div>
      </div>
    </div>
  )
}
