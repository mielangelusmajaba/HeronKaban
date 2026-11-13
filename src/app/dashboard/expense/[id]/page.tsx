"use client";

import Link from "next/link";
import { useState } from "react";

export default function ExpenseDetailPage() {
  const [isApproving, setIsApproving] = useState(false);

  // Mock data
  const expense = {
    id: "1",
    event: "General Assembly 2026",
    purpose: "Snacks and refreshments for 50 attendees",
    amount: 3500,
    officer: "Maria Santos",
    date: "2026-11-12",
    status: "pending",
    receipt: "/placeholder-receipt.jpg",
    approvals: [
      { officer: "Juan Dela Cruz", role: "President", timestamp: "2026-11-12 14:30" }
    ],
    requiredApprovals: 2,
    aiCheck: {
      status: "flagged",
      extractedAmount: 3800,
      extractedDate: "2026-11-11",
      items: [
        { name: "Pizza (5 boxes)", amount: 2500 },
        { name: "Softdrinks (2 cases)", amount: 800 },
        { name: "Paper plates & cups", amount: 300 },
        { name: "Ice", amount: 200 }
      ],
      flags: [
        {
          type: "amount_mismatch",
          severity: "high",
          message: "Receipt total (₱3,800) doesn't match claimed amount (₱3,500). Needs review."
        },
        {
          type: "purchase_mix",
          severity: "medium",
          message: "Food purchases make up 87% of total. High for a General Assembly."
        }
      ]
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">HeronKaban</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Banner */}
            {expense.aiCheck.flags.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">AI Flags Detected - Needs Review</h3>
                    <p className="text-sm text-red-700">
                      This expense has been flagged for human review. Officers should verify the details before approving.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Expense Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{expense.event}</h1>
                    <p className="text-gray-600">{expense.purpose}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    expense.status === "pending" 
                      ? "bg-yellow-100 text-yellow-700"
                      : expense.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {expense.status}
                  </span>
                </div>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Requested Amount</p>
                    <p className="text-2xl font-bold text-gray-900">₱{expense.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Submitted By</p>
                    <p className="text-lg font-medium text-gray-900">{expense.officer}</p>
                    <p className="text-sm text-gray-500">{expense.date}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Check Results */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">AI Verification Results</h2>
                </div>
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* Flags */}
                {expense.aiCheck.flags.map((flag, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      flag.severity === "high" 
                        ? "bg-red-50 border-red-200" 
                        : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        flag.severity === "high" ? "text-red-600" : "text-yellow-600"
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold uppercase ${
                            flag.severity === "high" ? "text-red-700" : "text-yellow-700"
                          }`}>
                            {flag.type.replace("_", " ")}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            flag.severity === "high" 
                              ? "bg-red-200 text-red-800" 
                              : "bg-yellow-200 text-yellow-800"
                          }`}>
                            {flag.severity}
                          </span>
                        </div>
                        <p className={`text-sm ${
                          flag.severity === "high" ? "text-red-900" : "text-yellow-900"
                        }`}>
                          {flag.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Extracted Data */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Receipt Data Extracted by AI</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Receipt Total</span>
                      <span className="text-sm font-medium text-gray-900">₱{expense.aiCheck.extractedAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Receipt Date</span>
                      <span className="text-sm font-medium text-gray-900">{expense.aiCheck.extractedDate}</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Items Purchased</p>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        {expense.aiCheck.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700">{item.name}</span>
                            <span className="font-medium text-gray-900">₱{item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt Image */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Receipt Image</h2>
              </div>
              <div className="p-6">
                <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center border border-gray-200">
                  <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Receipt image would appear here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Approval Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Approval Status</h3>
              </div>
              <div className="px-5 py-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium text-gray-900">
                      {expense.approvals.length} of {expense.requiredApprovals}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(expense.approvals.length / expense.requiredApprovals) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-3">
                  {expense.approvals.map((approval, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{approval.officer}</p>
                        <p className="text-xs text-gray-600">{approval.role}</p>
                        <p className="text-xs text-gray-500 mt-1">{approval.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {expense.approvals.length < expense.requiredApprovals && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      Needs {expense.requiredApprovals - expense.approvals.length} more approval(s)
                    </p>
                  </div>
                )}

                {/* Approve Button (Officers only) */}
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isApproving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Approving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Approve Request
                    </>
                  )}
                </button>

                <button className="w-full mt-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors border border-red-200">
                  Reject Request
                </button>
              </div>
            </div>

            {/* Blockchain Info */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-sm border border-yellow-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-yellow-400 rounded-lg"></div>
                <h3 className="font-semibold text-gray-900">On-Chain</h3>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                This request is recorded on BNB Smart Chain for full transparency.
              </p>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View on BSCScan →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
