
'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="en">
      <head>
        <title>404 - Page Not Found</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
        <style>{`
          body { font-family: 'Alegreya', serif; background-color: #FAF8F1; color: #0a0a0a; margin: 0; }
          .container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 1rem; }
          h1 { font-family: 'Belleza', sans-serif; font-size: 1.875rem; line-height: 2.25rem; color: #386641; margin-bottom: 1rem; }
          p { color: #525252; margin-bottom: 2rem; }
          a { display: inline-block; padding: 0.75rem 1.5rem; background-color: #386641; color: white; text-decoration: none; border-radius: 0.375rem; }
          a:hover { background-color: #2c5133; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div>
            <h1 className="font-headline text-3xl text-primary">404 - Page Not Found</h1>
            <p className="font-body text-lg text-muted-foreground">
              Oops! The page you are looking for does not exist. It might have been moved or deleted.
            </p>
            <Link href="/" className="font-body">
              Go back to Dashboard
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
