
'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Caught in Global Error Boundary:", error)
  }, [error])
  
  return (
    <html lang="en">
      <head>
        <title>Application Error</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
        <style>{`
          body { font-family: 'Alegreya', serif; background-color: #FAF8F1; color: #0a0a0a; margin: 0; }
          .container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 1rem; }
          .card { max-width: 42rem; width: 100%; background-color: #FAF8F1; border: 1px solid #BC4749; border-radius: 0.5rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
          h1 { font-family: 'Belleza', sans-serif; font-size: 1.5rem; line-height: 2rem; color: #BC4749; }
          .content { margin-top: 1rem; }
          p { color: #525252; }
          pre { margin-top: 0.5rem; font-size: 0.75rem; line-height: 1rem; background-color: rgba(188, 71, 73, 0.1); padding: 0.75rem; border-radius: 0.375rem; font-family: monospace; white-space: pre-wrap; text-align: left; border: 1px solid rgba(188, 71, 73, 0.2); color: #BC4749; }
          button { display: inline-flex; align-items: center; justify-content: center; border-radius: 0.375rem; font-size: 0.875rem; line-height: 1.25rem; font-weight: 500; padding: 0.5rem 1rem; margin-top: 1rem; cursor: pointer; border: 1px solid #BC4749; background-color: #BC4749; color: white; }
          button:hover { background-color: rgba(188, 71, 73, 0.9); }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="card">
            <h1>Application Error</h1>
            <div className="content">
              <p>An unrecoverable error occurred, and the application could not be loaded. This is often caused by a configuration issue or a problem connecting to essential services.</p>
              <pre>Error: {error.message || 'An unknown error occurred.'}</pre>
              <p style={{ fontSize: '0.875rem', lineHeight: '1.25rem', marginTop: '1rem' }}>
                Please try again. If the issue persists, you may need to check the application logs or contact support.
              </p>
              <button onClick={() => reset()}>
                Try to Reload
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
