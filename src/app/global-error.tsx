
'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'

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
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background text-foreground">
          <div className="w-full max-w-lg shadow-xl border border-destructive rounded-lg bg-card p-6">
            <header className="flex flex-col items-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
              <h1 className="font-headline text-2xl text-destructive">
                Application Error
              </h1>
            </header>
            <div className="mt-4 space-y-4">
              <p className="font-body text-muted-foreground">
                An unrecoverable error occurred, and the application could not be loaded. This is often caused by a configuration issue or a problem connecting to essential services.
              </p>
              <pre className="mt-2 text-xs bg-destructive/10 p-3 rounded-md font-mono whitespace-pre-wrap text-left border border-destructive/20 text-destructive-foreground">
                Error: {error.message || 'An unknown error occurred.'}
              </pre>
              <p className="text-sm font-body text-muted-foreground">
                Please try again. If the issue persists, you may need to check the application logs or contact support.
              </p>
              <button onClick={() => reset()} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full sm:w-auto font-body bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <RotateCw className="mr-2 h-4 w-4" />
                Try to Reload
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
