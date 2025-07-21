// src/components/shared/ClientBuildTimestamp.tsx
"use client";

import { useState, useEffect } from 'react';

interface ClientBuildTimestampProps {
  className?: string;
}

export function ClientBuildTimestamp({ className }: ClientBuildTimestampProps) {
  const [timestamp, setTimestamp] = useState<string | null>(null);

  useEffect(() => {
    // This code runs only on the client, after the initial render.
    // This safely avoids the hydration mismatch.
    setTimestamp(process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || new Date().toLocaleString());
  }, []);

  if (!timestamp) {
    // Render nothing on the server and during the initial client render
    // to ensure the server and client HTML match perfectly.
    return null;
  }

  return (
    <p className={className}>
      Build: {timestamp}
    </p>
  );
}
