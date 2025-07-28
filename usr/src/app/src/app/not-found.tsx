
'use client';

import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ fontFamily: "'Alegreya', serif", backgroundColor: '#FAF8F1', color: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 200px)', textAlign: 'center', padding: '1rem' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <div style={{ maxWidth: '42rem', width: '100%' }}>
        <Compass style={{ height: '5rem', width: '5rem', color: '#BC4749', margin: '0 auto 1rem' }} />
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
                <Home style={{ marginRight: '0.5rem', height: '1.25rem', width: '1.25rem' }} />
                Return to Dashboard
              </button>
            </Link>
        </div>
      </div>
    </div>
  )
}
