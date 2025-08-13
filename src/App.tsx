import { useState } from 'react';
import CaptchaVerification from './pages/CaptchaVerification';

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'failed';

function App() {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [showCaptcha, setShowCaptcha] = useState(false);

  const handleStartVerification = () => {
    setVerificationStatus('verifying');
    setShowCaptcha(true);
  };

  const handleVerificationComplete = (success: boolean) => {
    setVerificationStatus(success ? 'success' : 'failed');
    setShowCaptcha(false);

    // Auto reset after 5 seconds to give user time to read the message
    setTimeout(() => {
      setVerificationStatus('idle');
    }, 5000);
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'success':
        return 'Awesome! You passed the verification.';
      case 'failed':
        return 'Oops! That didn\'t work. Want to give it another shot?';
      default:
        return '';
    }
  };

  if (showCaptcha) {
    return (
      <CaptchaVerification
        onComplete={handleVerificationComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Security Check
        </h1>

        <p className="text-gray-600 mb-8">
          We need to make sure you're human. This will just take a moment!
        </p>

        <button
          onClick={handleStartVerification}
          disabled={verificationStatus === 'verifying'}
          className={`
            w-full py-3 px-6 rounded-lg font-medium text-white transition-all duration-200
            ${verificationStatus === 'verifying'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-brand-navy hover:bg-brand-gold hover:text-brand-navy active:bg-brand-gold'
            }
          `}
        >
          {verificationStatus === 'verifying' ? 'Working on it...' : 'Let\'s Verify You\'re Human'}
        </button>

        {/* Status message display */}
        <div className="mt-6 min-h-[60px] flex items-center justify-center">
          {getStatusMessage() && (
            <div className={`
              text-center p-4 rounded-lg border-2 transition-all duration-300
              ${verificationStatus === 'success'
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-red-50 border-red-300 text-red-700'
              }
            `}>
              <p className="text-lg font-semibold">
                {getStatusMessage()}
              </p>
              <p className="text-sm mt-1 opacity-75">
                {verificationStatus === 'success'
                  ? 'All set! You\'re good to go.'
                  : 'Just click the button above when you\'re ready.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
