# HeronKaban UI/UX Build Summary

## Overview
Complete UI/UX implementation for HeronKaban following the PRD requirements for transparent, AI-checked treasury management for UMak student organizations.

## Pages Created

### 1. Landing Page (`/`)
- **File**: `src/app/page.tsx`
- **Features**:
  - Hero section with HeronKaban branding
  - Value propositions (Transparency, AI-Checked, Multi-Approval)
  - Clear call-to-action for UMak Google sign-in
  - "Built on" section showcasing BNB Smart Chain and AI
  - Mobile-responsive design
- **Design**: Clean, modern, Heron-themed with blue/green gradient

### 2. Sign In Page (`/auth/signin`)
- **File**: `src/app/auth/signin/page.tsx`
- **Features**:
  - Google OAuth button with proper branding
  - UMak domain restriction notice
  - Feature highlights
  - Back to home link
- **Flow**: Routes to consent page on successful sign-in

### 3. Terms & Consent Page (`/auth/consent`)
- **File**: `src/app/auth/consent/page.tsx`
- **Features**:
  - Scrollable Terms of Service section
  - Scrollable Privacy Notice section
  - Two required checkboxes for consent
  - Timestamp capture (functional requirement FR-02)
  - Covers Philippine Data Privacy Act (RA 10173)
  - Mentions UMak handbook sections 4.2.21 and 4.2.26
- **Flow**: Routes to dashboard after acceptance

### 4. Dashboard (`/dashboard`)
- **File**: `src/app/dashboard/page.tsx`
- **Features**:
  - Organization header with name and type
  - Three quick stat cards:
    - Treasury Balance
    - Pending Requests
    - Flagged Items
  - Action buttons:
    - Deposit Dues
    - Create Expense Request
  - Recent activity feed showing:
    - Deposits (with + amount in green)
    - Expenses (with status badges)
    - AI flags when present
    - Approval progress
  - Read-only view for all members (FR-08)
  - Links to detail pages
- **Design**: Card-based layout, color-coded transaction types

### 5. Deposit Page (`/dashboard/deposit`)
- **File**: `src/app/dashboard/deposit/page.tsx`
- **Features**:
  - Amount input with peso (₱) symbol
  - Purpose dropdown (membership dues, activity fee, etc.)
  - Organization info display with current balance
  - "How deposits work" information box
  - Processing state with spinner
  - Form validation
- **Flow**: Submits deposit and returns to dashboard (FR-03)

### 6. New Expense Request (`/dashboard/expense/new`)
- **File**: `src/app/dashboard/expense/new/page.tsx`
- **Features**:
  - Event/activity name field
  - Purpose/description textarea
  - Amount input with peso symbol
  - Receipt photo upload with drag-and-drop
  - Image preview with remove button
  - AI verification info box explaining checks
  - Multi-approval warning notice
  - Processing state showing "Processing & AI Check"
  - All required fields marked with asterisk
- **Flow**: Submits request for AI verification and approval (FR-04, FR-05)
- **File Types**: Accepts PNG, JPG, JPEG (MAX 10MB)

### 7. Expense Detail Page (`/dashboard/expense/[id]`)
- **File**: `src/app/dashboard/expense/[id]/page.tsx`
- **Features**:
  - AI flags banner (when flags exist)
  - Expense details card with status badge
  - AI verification results section:
    - Individual flags with severity levels (high/medium)
    - Flag types: amount_mismatch, purchase_mix, duplicate, over_budget
    - Extracted receipt data (amount, date, items)
    - Item-by-item breakdown
  - Receipt image display area
  - Approval status sidebar:
    - Progress bar (X of Y approvals)
    - List of approvers with timestamps
    - Approve button for officers
    - Reject button
  - Blockchain info card with BSCScan link
  - Neutral, non-accusatory wording ("Needs review")
- **Design**: Two-column layout (main + sidebar on desktop)
- **Covers**: FR-05, FR-06, FR-07, FR-09

## Design System

### Colors
- **Primary Blue**: `bg-blue-600` - Main actions, branding
- **Success Green**: `bg-green-600` - Deposits, approvals, confirmations
- **Warning Yellow**: `bg-yellow-600` - Pending states, medium flags
- **Error Red**: `bg-red-600` - High severity flags, rejections
- **Neutral Gray**: Various shades for text, borders, backgrounds
- **Gradient Backgrounds**: `from-blue-50 via-white to-green-50` (Heron theme)

### Typography
- **Font**: Geist Sans (primary), Geist Mono (code/mono)
- **Headings**: Bold, clear hierarchy (text-3xl, text-2xl, text-lg)
- **Body**: text-sm to text-base for content
- **Status Text**: text-xs for badges and metadata

### Components
- **Cards**: White background, rounded-xl, shadow-sm, border
- **Buttons**: 
  - Primary: Blue with white text, hover effects
  - Secondary: White with border, gray text
  - Danger: Red for destructive actions
- **Form Inputs**: Border, rounded-lg, focus:ring-2
- **Status Badges**: Rounded pills with color-coded backgrounds
- **Icons**: Heroicons (outline style), inline SVG

### Layout
- **Max Width**: max-w-7xl for main content, max-w-3xl for forms
- **Spacing**: Consistent padding (px-4, py-6, gap-6)
- **Responsive**: Mobile-first with sm:, lg: breakpoints
- **Sticky Header**: Fixed navigation at top

## User Flows

### New Member Flow
1. Land on homepage → Sign in button
2. Click "Sign in with UMak Google" → Google OAuth
3. Accept Terms & Privacy → Consent checkboxes
4. Redirect to Dashboard → See org treasury

### Deposit Flow
1. Dashboard → "Deposit Dues" button
2. Enter amount and select purpose
3. Submit → Processing state → Return to dashboard
4. See deposit in recent activity

### Expense Request Flow (Officer)
1. Dashboard → "Create Expense Request" button
2. Fill event, purpose, amount
3. Upload receipt photo → Preview shown
4. Submit → "Processing & AI Check" state
5. Redirect to expense detail page → See AI results

### Approval Flow (Officer)
1. Dashboard → Click pending expense
2. Review expense details and AI flags
3. Check receipt image
4. Click "Approve Request" → Processing
5. Approval added to list → Progress bar updates
6. When 2/3 approvals reached → Funds released

## Alignment with PRD

### Functional Requirements Covered
- ✅ **FR-01**: UMak Google sign-in (page exists, backend needed)
- ✅ **FR-02**: Terms and consent with checkboxes and timestamp
- ✅ **FR-03**: Deposit dues interface with clear flow
- ✅ **FR-04**: Expense request form with all required fields
- ✅ **FR-05**: AI check results display (mock data shown)
- ✅ **FR-06**: AI flags visible with neutral wording
- ✅ **FR-07**: Multi-approval progress UI (2 of 3 shown)
- ✅ **FR-08**: Read-only dashboard for all members
- ✅ **FR-09**: Reject button present on expense detail

### Design Guidelines
- ✅ Feels like a normal app (no crypto jargon)
- ✅ Uses "dues" and "expenses" instead of "tokens"
- ✅ Heron-inspired blue/green branding
- ✅ Clear status indicators (pending, approved, flagged)
- ✅ Neutral AI flag wording ("Needs review")
- ✅ Mobile-friendly responsive layout
- ✅ Basic accessibility (contrast, labels, semantic HTML)

## Technical Stack (Frontend)
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript + React
- **Styling**: Tailwind CSS
- **Icons**: Heroicons (inline SVG)
- **Fonts**: Geist Sans, Geist Mono
- **State Management**: React useState (client components)

## What's Mocked
Currently using mock/placeholder data for:
- User information (Juan Dela Cruz, initials JD)
- Organization (CS Society)
- Treasury balance (₱25,000)
- Recent transactions
- AI check results (flags, extracted data)
- Approvals list
- Receipt images (placeholder div)

## Next Steps for Full Implementation
1. **Backend Integration**:
   - Connect Google OAuth with UMak domain check
   - Supabase setup (auth, database, storage)
   - API routes for deposits, expenses, approvals
   
2. **Blockchain**:
   - Deploy treasury smart contract to BSC testnet
   - Integrate ethers.js or viem
   - Wallet generation and management
   - Transaction signing and submission
   
3. **AI Integration**:
   - OpenRouter API setup with Gemma 4 26B
   - Receipt image upload to Supabase Storage
   - AI endpoint for receipt reading
   - Flag generation logic
   
4. **Data Persistence**:
   - Supabase tables (users, orgs, transactions, approvals)
   - Row Level Security policies
   - Real-time subscriptions for live updates

5. **Testing**:
   - Test with 10 sample receipts (4 with planted issues)
   - End-to-end flow testing
   - Multi-officer approval scenarios
   - Mobile responsive testing

## File Structure
```
src/
├── app/
│   ├── page.tsx                       # Landing page
│   ├── layout.tsx                     # Root layout
│   ├── globals.css                    # Global styles
│   ├── auth/
│   │   ├── signin/page.tsx           # Sign in
│   │   └── consent/page.tsx          # Terms & consent
│   └── dashboard/
│       ├── page.tsx                   # Dashboard
│       ├── deposit/page.tsx          # Deposit form
│       └── expense/
│           ├── new/page.tsx          # New expense
│           └── [id]/page.tsx         # Expense detail
└── components/
    └── Header.tsx                     # Shared header
```

## Running Locally
The app is currently running at:
- **Local**: http://localhost:3000
- **Network**: http://192.168.1.10:3000

All pages are accessible and interactive with mock data.

## Notes
- All UI text uses Filipino peso (₱) symbol
- Timestamp format: YYYY-MM-DD HH:mm
- File size limit: 10MB for receipts
- Color scheme matches UMak and Heron branding
- Accessibility: WCAG 2.1 AA basics (contrast, labels)
- No external dependencies for icons (inline SVG)

---

**Built for**: BCC 2026 × Binance Academy Hackathon  
**Date**: November 2026  
**Status**: UI/UX Complete, Ready for Backend Integration
