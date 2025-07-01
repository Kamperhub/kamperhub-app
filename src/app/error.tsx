'use client' // Error components must be Client Components

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Caught in Global Error Boundary:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
      <div className="max-w-lg w-full p-6 rounded-lg border border-red-500 bg-red-500/10 text-red-200">
        <h2 className="text-2xl font-bold text-red-400">Oops! Something Went Wrong</h2>
        <p className="mt-2 text-base text-red-300">
          An unexpected error occurred while trying to load this page.
        </p>
        <div className="mt-4 p-3 rounded-md bg-red-900/20 text-left">
            <p className="text-sm font-semibold text-red-300">Error Details:</p>
            <pre className="text-xs whitespace-pre-wrap font-mono mt-1">
                <code>{error.message || 'An unknown error occurred.'}</code>
            </pre>
        </div>
        <p className="mt-4 text-sm text-red-300">
            You can try to recover by clicking the button below. If the problem persists, please contact support.
        </p>
        <button
            onClick={() => reset()}
            className="mt-4 px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-900/20"
        >
            Try Again
        </button>
      </div>
    </div>
  )
}
