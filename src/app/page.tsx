import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl text-center space-y-8">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
              HeronKaban
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-xl sm:text-2xl text-gray-700 font-medium max-w-2xl mx-auto">
            Transparent, AI-checked treasury for UMak student organizations
          </p>

          {/* Value Props */}
          <div className="grid sm:grid-cols-3 gap-6 mt-12 text-left">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Full Transparency</h3>
              <p className="text-sm text-gray-600">See exactly where your dues go, with receipts and AI verification</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI-Checked</h3>
              <p className="text-sm text-gray-600">Every receipt is automatically checked for accuracy and flags issues</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Multi-Approval</h3>
              <p className="text-sm text-gray-600">Requires multiple officers to approve before funds are released</p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 space-y-4">
            <Link 
              href="/auth/signin"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with UMak Google
            </Link>
            <p className="text-sm text-gray-500">
              UMak student organizations only
            </p>
          </div>

          {/* Built with */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3">Built on</p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-8 h-8 bg-yellow-400 rounded-lg"></div>
                <span className="font-medium">BNB Smart Chain</span>
              </div>
              <div className="text-gray-300">•</div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#4285F4"/>
                  <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="#34A853"/>
                </svg>
                <span className="font-medium">AI-Powered</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-gray-200 bg-white/50">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600">
          <p>University of Makati • BCC 2026 × Binance Academy Hackathon</p>
        </div>
      </footer>
    </div>
  );
}
