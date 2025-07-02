'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RotateCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Caught in Route Segment Error Boundary:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-destructive">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="font-headline text-2xl text-destructive">
            Something Went Wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="font-body text-muted-foreground">
                An unexpected error occurred while trying to load this part of the application.
            </p>
            <Alert variant="destructive" className="text-left">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-headline">Error Details</AlertTitle>
                <AlertDescription className="font-mono text-xs whitespace-pre-wrap">
                    {error.message || 'An unknown error occurred.'}
                </AlertDescription>
            </Alert>
            <p className="text-sm font-body text-muted-foreground">
                You can attempt to recover by clicking the button below.
            </p>
            <Button onClick={() => reset()} variant="destructive" className="w-full sm:w-auto font-body">
                <RotateCw className="mr-2 h-4 w-4" />
                Try Again
            </Button>
        </CardContent>
      </Card>
    </div>
  )
}
