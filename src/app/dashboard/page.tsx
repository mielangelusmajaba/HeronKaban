import Link from "next/link";

export default function Dashboard() {
  // Mock data for prototype
  const orgBalance = 25000;
  const recentTransactions = [
    {
      id: "1",
      type: "deposit",
      amount: 500,
      member: "Juan Dela Cruz",
      date: "2026-11-10",
      purpose: "Membership dues",
    },
    {
      id: "2",
      type: "expense",
      amount: 1200,
      officer: "Maria Santos",
      date: "2026-11-09",
      purpose: "General Assembly snacks",
      status: "approved",
      flags: 0,
    },
    {
      id: "3",
      type: "expense",
      amount: 3500,
      officer: "Pedro Reyes",
      date: "2026-11-08",
      purpose: "Team building venue",
      status: "pending",
      flags: 1,
      approvals: 1,
      required: 2,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">HeronKaban</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  JD
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Org Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CS Society Treasury</h1>
          <p className="text-gray-600">Computer Science Student Organization</p>
        </div>

        {/* Quick Stats */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Treasury Balance</span>
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">₱{orgBalance.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Pending Requests</span>
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">1</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Flagged Items</span>
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">1</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link 
            href="/dashboard/deposit"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Deposit Dues
          </Link>
          
          <Link 
            href="/dashboard/expense/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors border border-gray-300 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Create Expense Request
          </Link>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      tx.type === "deposit" 
                        ? "bg-green-100" 
                        : tx.status === "approved" 
                          ? "bg-blue-100" 
                          : "bg-yellow-100"
                    }`}>
                      {tx.type === "deposit" ? (
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                        </svg>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{tx.purpose}</p>
                        {tx.flags && tx.flags > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Needs review
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {tx.type === "deposit" ? tx.member : tx.officer} • {tx.date}
                      </p>
                      {tx.type === "expense" && tx.status === "pending" && (
                        <p className="text-sm text-gray-500 mt-1">
                          Approvals: {tx.approvals}/{tx.required}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right ml-4">
                    <p className={`text-lg font-semibold ${
                      tx.type === "deposit" ? "text-green-600" : "text-gray-900"
                    }`}>
                      {tx.type === "deposit" ? "+" : "-"}₱{tx.amount.toLocaleString()}
                    </p>
                    {tx.type === "expense" && (
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded mt-1 ${
                        tx.status === "approved" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {tx.status}
                      </span>
                    )}
                  </div>
                </div>

                {tx.type === "expense" && (
                  <Link 
                    href={`/dashboard/expense/${tx.id}`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                  >
                    View details →
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all transactions
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
