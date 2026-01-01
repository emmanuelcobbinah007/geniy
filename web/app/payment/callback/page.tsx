"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";

function PaymentCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, refreshUser } = useAuth();

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference');
      const trxref = searchParams.get('trxref');
      const ref = reference || trxref;

      if (!ref) {
        setStatus('error');
        setMessage('No payment reference found');
        return;
      }

      try {
        // Check for pending workspace (new workspace creation flow)
        const pendingWorkspace = localStorage.getItem('pendingWorkspace');
        // Check for pending subscription (existing workspace upgrade flow)
        const pendingSubscription = localStorage.getItem('pendingSubscription');

        if (pendingWorkspace) {
          // New workspace creation flow
          const { name, planTier, hasTrial } = JSON.parse(pendingWorkspace);
          
          setMessage('Creating your workspace...');
          
          // Create workspace with the selected plan tier
          const workspace = await api.createWorkspace(name, token!, planTier);
          
          // Clear pending data
          localStorage.removeItem('pendingWorkspace');
          
          // Refresh user to get updated workspaces
          if (refreshUser) {
            await refreshUser();
          }

          setStatus('success');
          setMessage(hasTrial 
            ? 'Workspace created! Your 14-day trial has started.' 
            : 'Workspace created! Welcome to Pro!'
          );

          // Redirect to the new workspace
          setTimeout(() => {
            router.push(`/dashboard/${workspace.id}`);
          }, 2000);

        } else if (pendingSubscription) {
          // Existing workspace upgrade flow
          const { workspaceId, planTier } = JSON.parse(pendingSubscription);

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              reference: ref,
              workspaceId,
              planTier,
              amount: planTier === 'PRO' ? 1185 : 435, // GHS amounts
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Payment verification failed');
          }

          // Clear pending subscription data
          localStorage.removeItem('pendingSubscription');

          setStatus('success');
          setMessage('Payment successful! Redirecting to your dashboard...');

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push(`/dashboard/${workspaceId}`);
          }, 2000);

        } else {
          throw new Error('No pending payment found. Please try again.');
        }

      } catch (error: any) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage(error.message || 'Payment verification failed');
      }
    };

    if (token) {
      verifyPayment();
    }
  }, [searchParams, token, router, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-md w-full mx-auto p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto text-violet-600 animate-spin mb-6" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Processing Payment</h1>
            <p className="text-zinc-500">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto text-emerald-500 mb-6" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Success!</h1>
            <p className="text-zinc-500 mb-6">{message}</p>
            <Button onClick={() => router.push('/dashboard')} className="bg-violet-600 hover:bg-violet-700">
              Go to Dashboard
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto text-red-500 mb-6" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Payment Failed</h1>
            <p className="text-zinc-500 mb-6">{message}</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => router.push('/')}>
                Back to Home
              </Button>
              <Button onClick={() => router.push('/#pricing')} className="bg-violet-600 hover:bg-violet-700">
                Try Again
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-md w-full mx-auto p-8 text-center">
          <Loader2 className="w-16 h-16 mx-auto text-violet-600 animate-spin mb-6" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Loading...</h1>
        </div>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}
