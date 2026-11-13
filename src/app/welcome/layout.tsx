import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { requireViewer } from "@/lib/auth";

async function Header() {
  const viewer = await requireViewer();
  return <AppHeader viewer={viewer} />;
}

export default function WelcomeLayout({ children }: LayoutProps<"/welcome">) {
  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <Suspense fallback={<div className="h-14 border-b border-gray-200 bg-white" />}>
        <Header />
      </Suspense>
      {children}
    </div>
  );
}
