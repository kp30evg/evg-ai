import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Force organization selection/creation
  if (!orgId) {
    redirect('/select-org');
  }

  return <>{children}</>;
}