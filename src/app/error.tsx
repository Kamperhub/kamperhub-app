
'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Caught in Error Boundary:", error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-lg text-center shadow-xl border-destructive">
            <CardHeader>
                 <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mb-4">
                    <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>
                <CardTitle className="font-headline text-2xl text-destructive">
                    Oops! Something went wrong.
                </CardTitle>
                <CardDescription className="font-body text-base text-muted-foreground pt-2">
                    An unexpected error occurred while trying to load this page.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-muted p-3 rounded-md text-left">
                    <p className="text-sm font-semibold text-foreground">Error Details:</p>
                    <pre className="text-xs text-destructive-foreground whitespace-pre-wrap font-mono bg-destructive p-2 rounded-md mt-1">
                        <code>{error.message || 'An unknown error occurred.'}</code>
                    </pre>
                </div>
                <p className="font-body text-sm text-muted-foreground">
                    You can try to recover by clicking the button below. If the problem persists, please contact support.
                </p>
                <Button
                    onClick={() => reset()}
                    className="font-body bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    Try Again
                </Button>
            </CardContent>
        </Card>
    </div>
  )
}
