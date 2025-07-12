'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RotateCw } from 'lucide-react'
import './globals.css'

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
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background">
          <Card className="w-full max-w-lg shadow-xl border-destructive">
            <CardHeader>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
              <CardTitle className="font-headline text-2xl text-destructive">
                Application Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-body text-muted-foreground">
                An unrecoverable error occurred, and the application could not be loaded. This is often caused by a configuration issue or a problem connecting to essential services.
              </p>
              <pre className="mt-2 text-xs bg-destructive/10 p-3 rounded-md font-mono whitespace-pre-wrap text-left border border-destructive/20">
                Error: {error.message || 'An unknown error occurred.'}
              </pre>
              <p className="text-sm font-body text-muted-foreground">
                Please try again. If the issue persists, you may need to check the application logs or contact support.
              </p>
              <Button onClick={() => reset()} variant="destructive" className="w-full sm:w-auto font-body">
                <RotateCw className="mr-2 h-4 w-4" />
                Try to Reload
              </Button>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}
