"use client";

import { useState } from "react";
import Link from "next/link";

export default function ConsentPage() {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleContinue = async () => {
    if (!agreedToTerms || !agreedToPrivacy) return;
    
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-gray-900">HeronKaban</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Terms & Privacy</h1>
            <p className="text-gray-600">Please review and accept to continue</p>
          </div>

          {/* Consent Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Terms Section */}
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Terms of Service</h2>
              <div className="bg-gray-50 rounded-lg p-6 max-h-64 overflow-y-auto border border-gray-200 text-sm text-gray-700 space-y-3">
                <p className="font-medium">HeronKaban Usage Agreement</p>
                
                <p>By using HeronKaban, you agree to:</p>
                
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use the platform only for legitimate University of Makati student organization treasury management</li>
                  <li>Provide accurate information when creating expense requests</li>
                  <li>Upload genuine receipts that correspond to actual expenses</li>
                  <li>Comply with UMak Student Handbook provisions regarding organization funds (sections 4.2.21 and 4.2.26)</li>
                  <li>Not attempt to manipulate, bypass, or circumvent AI verification or approval mechanisms</li>
                </ul>

                <p className="font-medium mt-4">Prototype Notice</p>
                <p>
                  This is a hackathon prototype running on BNB Smart Chain testnet. 
                  No real money is involved. All transactions use test tokens only.
                </p>

                <p className="font-medium mt-4">Officer Responsibilities</p>
                <p>
                  Officers with approval rights must review all AI flags carefully and verify 
                  expense legitimacy before approving requests.
                </p>
              </div>
            </div>

            {/* Privacy Section */}
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy Notice</h2>
              <div className="bg-gray-50 rounded-lg p-6 max-h-64 overflow-y-auto border border-gray-200 text-sm text-gray-700 space-y-3">
                <p className="font-medium">Data We Collect</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Name and UMak Google email address</li>
                  <li>Organization membership and role (member/officer)</li>
                  <li>Deposit and expense transaction records</li>
                  <li>Receipt images you upload</li>
                  <li>Blockchain wallet address (auto-generated)</li>
                </ul>

                <p className="font-medium mt-4">How We Use Your Data</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Verify your UMak student status</li>
                  <li>Process deposits and expense requests</li>
                  <li>Run AI verification on receipts</li>
                  <li>Display transaction history to your organization</li>
                  <li>Maintain audit trails on the blockchain</li>
                </ul>

                <p className="font-medium mt-4">Data Sharing</p>
                <p>
                  Receipt images are sent to AI provider (OpenRouter) for verification. 
                  Transaction records are public to your organization members. 
                  On-chain data (amounts, timestamps) is public on BSC testnet.
                </p>

                <p className="font-medium mt-4">Your Rights</p>
                <p>
                  Under the Philippine Data Privacy Act (RA 10173), you have rights to access, 
                  correct, and delete your personal data. Contact your organization admin or 
                  refer to UMak's Data Privacy and Records Management Service (DPRMS).
                </p>
              </div>
            </div>

            {/* Consent Checkboxes */}
            <div className="px-8 py-6 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  I have read and agree to the <span className="font-medium">Terms of Service</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToPrivacy}
                  onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  I have read and agree to the <span className="font-medium">Privacy Notice</span> and understand how my data will be used
                </span>
              </label>

              <div className="pt-4 flex gap-3">
                <Link
                  href="/auth/signin"
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
                >
                  Back
                </Link>
                <button
                  onClick={handleContinue}
                  disabled={!agreedToTerms || !agreedToPrivacy || isProcessing}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Setting up...
                    </>
                  ) : (
                    "Accept & Continue"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 px-4 border-t border-gray-200 bg-white/50">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600">
          <p>University of Makati • BCC 2026 × Binance Academy Hackathon</p>
        </div>
      </footer>
    </div>
  );
}
