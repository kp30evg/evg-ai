import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: 'bg-green-600 hover:bg-green-700',
            card: 'shadow-xl',
          }
        }}
      />
    </div>
  );
}