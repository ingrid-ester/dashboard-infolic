import { createClient } from "@/lib/supabase/server";
import { resolveComparisonPeriod, resolvePeriod } from "@/lib/dashboard/period";
import { fetchDailySpend, fetchMetaSpend, fetchVideoRetention } from "@/lib/dashboard/queries";
import { computeVideoRetention } from "@/lib/dashboard/metrics";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";

type PageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    compareFrom?: string;
    compareTo?: string;
  }>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const period = resolvePeriod(params);
  const previousPeriod = resolveComparisonPeriod(period, params);

  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    investimento,
    previousInvestimento,
    dailySpend,
    videoRetentionRows,
  ] = await Promise.all([
    supabase.auth.getUser(),
    fetchMetaSpend(supabase, period),
    fetchMetaSpend(supabase, previousPeriod),
    fetchDailySpend(supabase, period),
    fetchVideoRetention(supabase),
  ]);
  const userName = (user?.user_metadata?.name as string | undefined) ?? user?.email ?? "";

  const visaoGeralProps = {
    userName,
    investimento,
    previousInvestimento,
  };

  const marketingProps = {
    investimento,
    previousInvestimento,
    dailySpend,
    videoRetention: computeVideoRetention(videoRetentionRows),
  };

  return <DashboardTabs visaoGeral={visaoGeralProps} marketing={marketingProps} />;
}
