# HeronKaban Design System

## Brand Identity

### Logo
- **Icon**: Shield with checkmark (security + verification)
- **Colors**: Blue background (#2563EB), white icon
- **Shape**: Rounded square (rounded-2xl or rounded-xl)
- **Sizes**: 
  - Large (landing): 64px × 64px
  - Small (header): 40px × 40px

### Typography
```
Font Family: 'Geist Sans' (primary), 'Geist Mono' (monospace)
Headings: Bold weight (font-bold)
Body: Normal weight (font-normal to font-medium)
```

## Color Palette

### Primary Colors
| Color | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| Primary Blue | #2563EB | `bg-blue-600` | CTAs, branding, links |
| Blue Hover | #1D4ED8 | `bg-blue-700` | Button hover states |
| Blue Light | #DBEAFE | `bg-blue-50` | Backgrounds, info boxes |

### Semantic Colors
| Purpose | Hex | Tailwind Class | Usage |
|---------|-----|----------------|-------|
| Success | #16A34A | `bg-green-600` | Deposits, approvals, success states |
| Warning | #CA8A04 | `bg-yellow-600` | Pending, medium flags |
| Error | #DC2626 | `bg-red-600` | High flags, errors, rejections |
| Neutral | #4B5563 | `bg-gray-600` | Text, secondary elements |

### Background Gradients
```css
/* Landing page */
from-blue-50 via-white to-green-50

/* Section headers */
from-blue-50 to-white
from-purple-50 to-blue-50
from-purple-50 to-white
```

## Components

### Buttons

#### Primary Button
```tsx
<button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
  Primary Action
</button>
```

#### Secondary Button
```tsx
<button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
  Secondary Action
</button>
```

#### Danger Button
```tsx
<button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors border border-red-200">
  Reject
</button>
```

#### Loading State
```tsx
<button disabled className="... disabled:bg-blue-400 disabled:cursor-not-allowed">
  <svg className="animate-spin h-5 w-5" />
  Processing...
</button>
```

### Cards

#### Standard Card
```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200">
  <div className="px-6 py-4 border-b border-gray-200">
    <h2 className="text-lg font-semibold text-gray-900">Title</h2>
  </div>
  <div className="px-6 py-5">
    {/* Content */}
  </div>
</div>
```

#### Stat Card
```tsx
<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-medium text-gray-600">Label</span>
    {/* Icon */}
  </div>
  <p className="text-3xl font-bold text-gray-900">Value</p>
</div>
```

### Status Badges

#### Pending
```tsx
<span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
  pending
</span>
```

#### Approved
```tsx
<span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
  approved
</span>
```

#### Flagged/Needs Review
```tsx
<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
  <svg className="w-3 h-3" />
  Needs review
</span>
```

### Form Inputs

#### Text Input
```tsx
<input
  type="text"
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  placeholder="Enter text"
/>
```

#### Amount Input (with peso symbol)
```tsx
<div className="relative">
  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₱</span>
  <input
    type="number"
    className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
    placeholder="0.00"
  />
</div>
```

#### Textarea
```tsx
<textarea
  rows={3}
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
  placeholder="Description"
/>
```

#### Select Dropdown
```tsx
<select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
  <option value="">Select option</option>
</select>
```

#### File Upload
```tsx
<label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
  <div className="flex flex-col items-center justify-center pt-5 pb-6">
    {/* Icon and text */}
  </div>
  <input type="file" className="hidden" />
</label>
```

### Info Boxes

#### Info (Blue)
```tsx
<div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
  <div className="flex items-start gap-3">
    <svg className="w-5 h-5 text-blue-600 mt-0.5" />
    <div>
      <p className="text-sm font-medium text-gray-900">Title</p>
      <p className="text-sm text-gray-600">Description</p>
    </div>
  </div>
</div>
```

#### Warning (Yellow)
```tsx
<div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
  <div className="flex items-start gap-3">
    <svg className="w-5 h-5 text-yellow-600 mt-0.5" />
    <p className="text-sm text-gray-700">Warning message</p>
  </div>
</div>
```

#### Error/Flag (Red)
```tsx
<div className="bg-red-50 rounded-lg p-4 border border-red-200">
  <div className="flex items-start gap-3">
    <svg className="w-6 h-6 text-red-600 mt-0.5" />
    <div>
      <h3 className="font-semibold text-red-900 mb-1">Title</h3>
      <p className="text-sm text-red-700">Description</p>
    </div>
  </div>
</div>
```

#### Success (Green)
```tsx
<div className="bg-green-50 rounded-lg p-3 border border-green-200">
  <div className="flex items-start gap-3">
    <svg className="w-5 h-5 text-green-600 mt-0.5" />
    <div>
      <p className="text-sm font-medium text-gray-900">Success message</p>
    </div>
  </div>
</div>
```

### AI Flag Severity Indicators

#### High Severity
```tsx
<div className="p-4 rounded-lg border bg-red-50 border-red-200">
  <div className="flex items-start gap-3">
    <svg className="w-5 h-5 text-red-600 mt-0.5" />
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold uppercase text-red-700">
          AMOUNT MISMATCH
        </span>
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-200 text-red-800">
          high
        </span>
      </div>
      <p className="text-sm text-red-900">Flag message</p>
    </div>
  </div>
</div>
```

#### Medium Severity
```tsx
<div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
  <div className="flex items-start gap-3">
    <svg className="w-5 h-5 text-yellow-600 mt-0.5" />
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold uppercase text-yellow-700">
          PURCHASE MIX
        </span>
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-200 text-yellow-800">
          medium
        </span>
      </div>
      <p className="text-sm text-yellow-900">Flag message</p>
    </div>
  </div>
</div>
```

## Icons

All icons use Heroicons (outline style) as inline SVG.

### Common Icons
- **Shield with checkmark**: Brand logo, security
- **Check circle**: Approvals, success
- **Exclamation triangle**: Warnings, flags
- **Eye**: Transparency, visibility
- **Lock**: Security, multi-approval
- **Lightning bolt**: AI features
- **Document**: Receipts, expenses
- **Plus**: Add, deposit
- **Arrow up**: Deposit transaction
- **Arrow down**: Expense transaction
- **Bell**: Notifications
- **User circle**: Profile

### Icon Sizing
```tsx
// Small
<svg className="w-4 h-4" />

// Medium
<svg className="w-5 h-5" />

// Large
<svg className="w-6 h-6" />

// Extra Large
<svg className="w-10 h-10" />
```

## Layout

### Container
```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Form Container
```tsx
<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {/* Form content */}
</div>
```

### Grid Layout (Stats, Cards)
```tsx
<div className="grid sm:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

### Two-Column Layout (Detail Page)
```tsx
<div className="grid lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Main content */}
  </div>
  <div>
    {/* Sidebar */}
  </div>
</div>
```

## Spacing

### Padding
- **Card/Container**: `px-6 py-5` or `p-6`
- **Tight**: `px-4 py-3`
- **Button**: `px-6 py-3` or `px-4 py-2`
- **Section**: `py-8`

### Gap
- **Default**: `gap-6`
- **Tight**: `gap-3`
- **List items**: `space-y-3` or `space-y-4`

## Responsive Breakpoints
```
sm: 640px   (tablet)
md: 768px   (small desktop)
lg: 1024px  (large desktop)
xl: 1280px  (extra large)
```

### Mobile-First Approach
```tsx
// Default (mobile)
<div className="grid grid-cols-1 gap-4">

// Tablet and up
<div className="grid sm:grid-cols-2 gap-4">

// Desktop and up
<div className="grid lg:grid-cols-3 gap-6">
```

## Transitions & Animations

### Hover Transitions
```tsx
className="transition-colors hover:bg-blue-700"
className="transition-all hover:shadow-xl hover:-translate-y-0.5"
```

### Loading Spinner
```tsx
<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>
```

## Accessibility

### Focus States
All interactive elements include:
```tsx
focus:ring-2 focus:ring-blue-500 focus:border-transparent
```

### Text Contrast
- **Primary text**: `text-gray-900` on white
- **Secondary text**: `text-gray-600` on white
- **Light text**: `text-gray-500` on white
- All combinations meet WCAG 2.1 AA standards

### Semantic HTML
- Use `<button>` for actions
- Use `<Link>` for navigation
- Use proper heading hierarchy (h1 → h2 → h3)
- Include `alt` text for images
- Use `aria-label` when text isn't visible

### Required Fields
```tsx
<label>
  Field Name <span className="text-red-500">*</span>
</label>
<input required />
```

## Wording Guidelines

### Tone
- **Neutral**: "Needs review" not "Suspicious"
- **Clear**: "2 of 3 officers must approve"
- **Simple**: "Dues" not "Tokens", "Expenses" not "Transactions"

### Status Text
- ✅ "pending" (lowercase)
- ✅ "approved" (lowercase)
- ✅ "Needs review" (sentence case for flags)
- ✅ "Processing..." (with ellipsis)

### Currency
Always use peso symbol: **₱**
```
₱25,000  (with comma separators)
₱3,500.50  (with decimals when needed)
```

## File Organization
```
src/
├── app/              # Pages (Next.js App Router)
├── components/       # Reusable components
├── lib/             # Utilities, helpers
└── styles/          # Global CSS (if needed)
```

---

**Consistency is key**: Use this design system across all new pages and components to maintain a cohesive user experience.
