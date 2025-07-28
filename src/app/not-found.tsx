
'use client';

import Link from 'next/link';
import { Compass, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 200px)', // Using calc for vh calculation
      padding: '1rem',
      backgroundColor: '#FAF8F1', // Directly set background color
      color: '#333', // Directly set text color
      fontFamily: "'Alegreya', serif", // Directly set font-family
      textAlign: 'center',
    }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <div style={{ maxWidth: '600px', width: '100%' }}>
        {/* Simple SVG for an icon if desired, or just omit icon */}
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#BC4749" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', display: 'block' }}>
          <path d="M18 13V10" />
          <path d="M22 14V10" />
          <path d="M12 18H5c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v2" />
          <path d="M14 2H6a2 2 0 0 0-2 2v2" />
          <path d="M2.5 10a2 2 0 0 1 0 4" />
          <path d="m15 16-2 2-2-2" />
          <path d="M14 22h-4" />
        </svg>
        <h1 style={{ fontFamily: "'Belleza', sans-serif", fontSize: '3rem', color: '#BC4749', marginTop: '0', marginBottom: '0.5rem' }}>
          404
        </h1>
        <h2 style={{ fontFamily: "'Belleza', sans-serif", fontSize: '1.5rem', color: '#386641', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          Page Not Found
        </h2>
        <p style={{ color: '#333', marginTop: '1.5rem' }}>
          Oops! It seems you've taken a wrong turn. The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ marginTop: '2rem' }}>
          <a href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#386641', // Primary color
            color: '#F8F8F8', // Primary foreground color
            textDecoration: 'none',
            borderRadius: '0.5rem',
            fontFamily: "'Alegreya', serif",
            fontWeight: 'normal',
            transition: 'background-color 0.2s ease',
          }} onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2a4d31')}
             onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#386641')}>
            {/* Home Icon as inline SVG or just text */}
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
