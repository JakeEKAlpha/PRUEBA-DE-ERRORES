import React from 'react';
import type { GoogleUserProfile } from '../../types';
import { LoginScreen } from './LoginScreen';
import { ForgotAccessModal } from './ForgotAccessModal';
import { Unauthorized403Screen } from './Unauthorized403Screen';
import { AuthLoadingScreen } from './AuthStatusScreens';

interface AppAuthGateProps {
  authState: 'loading' | 'unauthenticated' | 'unauthorized';
  isDark: boolean;
  isSigningIn: boolean;
  isForgotAccessOpen: boolean;
  currentUser: GoogleUserProfile;
  onGoogleSignIn: () => void;
  onOpenForgotAccess: () => void;
  onCloseForgotAccess: () => void;
  onSignOut: () => void;
}

export const AppAuthGate: React.FC<AppAuthGateProps> = ({
  authState,
  isDark,
  isSigningIn,
  isForgotAccessOpen,
  currentUser,
  onGoogleSignIn,
  onOpenForgotAccess,
  onCloseForgotAccess,
  onSignOut,
}) => {
  if (authState === 'loading') return <AuthLoadingScreen isDark={isDark} />;
  if (authState === 'unauthenticated') {
    return (
      <>
        <LoginScreen
          onSignIn={onGoogleSignIn}
          onOpenForgotAccess={onOpenForgotAccess}
          isLoading={isSigningIn}
          isDark={isDark}
        />
        <ForgotAccessModal
          isOpen={isForgotAccessOpen}
          onClose={onCloseForgotAccess}
          isDark={isDark}
        />
      </>
    );
  }
  return (
    <Unauthorized403Screen
      userProfile={currentUser}
      onSignOut={onSignOut}
      isDark={isDark}
    />
  );
};
