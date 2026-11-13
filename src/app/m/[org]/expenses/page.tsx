import { Suspense } from "react";
import { RequestList } from "@/components/treasury/display";
import { PageLoading } from "@/components/ui";
import { requireOrgAccess } from "@/lib/auth";
import { formatPeso } from "@/lib/chain/money";
import { listRequests } from "@/lib/treasury/queries";

async function Expenses({ params }: PageProps<"/m/[org]/expenses">) {
  const { org: slug } = await params;
  const { org } = await requireOrgAccess(slug, "member");
  const rows = (await listRequests(org.id)).filter((x) => x.r.status === "released");
  const total = rows.reduce((s, x) => s + x.r.amount, 0);
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Released expenses</h2>
        <p className="text-sm text-gray-600">
          {rows.length} expense(s), {formatPeso(total)} in total. Open one to see its receipt, the AI notes and who approved it.
        </p>
      </div>
      <RequestList rows={rows} base={`/m/${slug}/requests`} empty="No money has been spent yet." />
    </section>
  );
}

export default function ExpensesPage(props: PageProps<"/m/[org]/expenses">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Expenses {...props} />
    </Suspense>
  );
}
