import { Suspense } from "react";
import { WalletLink } from "@/components/treasury/chain-widgets";
import { PageHeader } from "@/components/treasury/PageHeader";
import { Card, Notice, PageLoading } from "@/components/ui";
import { requireOrgAccess } from "@/lib/auth";
import { CHAIN_ID, isLocalChain, networkLabel, RPC_URL } from "@/lib/chain/config";

async function Wallet({ params }: PageProps<"/o/[org]/wallet">) {
  const { org: slug } = await params;
  const { viewer, org } = await requireOrgAccess(slug, "committee");
  const onChainSigner = Boolean(viewer.profile.walletAddress && org.chainSigners?.includes(viewer.profile.walletAddress));
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="My wallet"
        description="Signer officers approve expenses with their own wallet. HeronKaban never holds your keys and can't approve for you."
      />
      <Card>
        <WalletLink userId={viewer.id} linked={viewer.profile.walletAddress} />
        {viewer.profile.walletAddress && (
          <p className="mt-3 text-sm text-gray-600">
            {onChainSigner ? "✓ This wallet is on this org's on-chain signer list." : "This wallet is not on this org's on-chain signer list."}
          </p>
        )}
      </Card>
      <Card className="space-y-2 text-sm">
        <h2 className="font-semibold text-gray-900">Network</h2>
        <p>
          {networkLabel} · chain ID {CHAIN_ID}
        </p>
        <p className="font-mono text-xs break-all text-gray-600">{RPC_URL}</p>
        {isLocalChain && (
          <Notice tone="amber">
            Demo setup: in MetaMask, import one of the Hardhat test accounts printed by <code>npm run chain:node</code> (accounts #1
            to #3 for officers). Those keys are public: never use them on a real network.
          </Notice>
        )}
      </Card>
    </div>
  );
}

export default function WalletPage(props: PageProps<"/o/[org]/wallet">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Wallet {...props} />
    </Suspense>
  );
}
