import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { createPageUrl } from '@/utils';
import PartnerChallengeManager from '@/components/partner/PartnerChallengeManager';
import { goToLogin } from '@/lib/navigation';

export default function PartnerChallenges() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await api.auth.me();
        setUser(userData);
        if (!userData.is_partner) {
          window.location.href = createPageUrl('Home');
        }
      } catch (e) {
        goToLogin();
      }
    };
    loadUser();
  }, []);

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