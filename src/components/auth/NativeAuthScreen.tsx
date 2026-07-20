import React from 'react';
import { isNative } from '../../utils/capacitorService';

/**
 * Premium full-screen wrapper for the login/register pages on the native mobile app.
 *
 * On web, the LoginPage is also used as an embedded modal inside public SaaS pages,
 * so we can't change its layout there. Instead, this wrapper detects native and
 * wraps the auth card in a premium full-screen experience: gradient backdrop,
 * branding header, safe-area aware centering, and a frosted card.
 *
 * On web, it simply renders children as-is (preserving the existing modal behavior).
 */
const NativeAuthScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isNative) return <>{children}</>;

  return (
    <div className="rb-native-auth-screen safe-top">
      {/* Decorative gradient blobs */}
      <div className="rb-native-auth-blob rb-native-auth-blob-1" />
      <div className="rb-native-auth-blob rb-native-auth-blob-2" />
      <div className="rb-native-auth-blob rb-native-auth-blob-3" />

      {/* Branding header */}
      <div className="rb-native-auth-header">
        <div className="rb-native-auth-logo-ring">
          <img src="/icons/icon logo.png" alt="RestoByte" className="rb-native-auth-logo" />
        </div>
        <h1 className="rb-native-auth-title">RestoByte</h1>
        <p className="rb-native-auth-tagline">Restaurant Management, reimagined.</p>
      </div>

      {/* Frosted card containing the auth form */}
      <div className="rb-native-auth-card-wrap">
        <div className="rb-native-auth-card">{children}</div>
        <p className="rb-native-auth-footer">Powered by IT Relevant Pvt. Ltd</p>
      </div>

      <div className="safe-bottom" />
    </div>
  );
};

export default NativeAuthScreen;
