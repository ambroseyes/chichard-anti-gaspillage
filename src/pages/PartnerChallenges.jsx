import React from 'react';
import PartnerChallengeManager from '@/components/partner/PartnerChallengeManager';
import { useAuth } from '@/lib/AuthContext';

export default function PartnerChallenges() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <PartnerChallengeManager user={user} />
      </div>
    </div>
  );
}