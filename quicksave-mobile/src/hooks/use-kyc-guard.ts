import { useRouter } from 'expo-router';
import { useAppSelector } from '../store';

export function useKycGuard() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  // The wrapper function
  const withKyc = (action: () => void) => {
    // If they are TIER_0 (or null/undefined just in case), block the action and open the modal
    if (!user?.kycTier || user.kycTier === 'TIER_0') {
      router.push('/kyc/bvn-setup');
    } else {
      // They are verified! Execute the action they wanted to do.
      action();
    }
  };

  return { withKyc };
}