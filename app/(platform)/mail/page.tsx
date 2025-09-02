'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function MailPage() {
  useEffect(() => {
    // Redirect to inbox by default
    redirect('/mail/inbox');
  }, []);

  return null;
}