// This file is reverted and effectively removed.
// To re-implement an AuthGuard, add your component code here.
import type { ReactNode } from 'react';

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  // Default behavior: render children as no auth is enforced.
  return <>{children}</>;
};
