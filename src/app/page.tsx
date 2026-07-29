import { createClient } from "@/lib/supabase/server";
import { resolveComparisonPeriod, resolvePeriod } from "@/lib/dashboard/period";
import {
  fetchCreativeRanking,
  fetchDailyLeads,
  fetchMetaLeads,
  fetchMetaSpend,
  fetchVideoRetention,
} from "@/lib/dashboard/queries";
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
    leads,
    previousLeads,
    dailyLeads,
    creativeRanking,
    videoRetentionRows,
  ] = await Promise.all([
    supabase.auth.getUser(),
    fetchMetaSpend(supabase, period),
    fetchMetaSpend(supabase, previousPeriod),
    fetchMetaLeads(supabase, period),
    fetchMetaLeads(supabase, previousPeriod),
    fetchDailyLeads(supabase, period),
    fetchCreativeRanking(supabase, period),
    fetchVideoRetention(supabase),
  ]);
  const cpl = leads > 0 ? investimento / leads : null;
  const previousCpl = previousLeads > 0 ? previousInvestimento / previousLeads : null;
  const evolution = dailyLeads.map((d) => ({ data: d.data, leads: d.leads, vendas: 0, sqls: 0 }));
  const userName = (user?.user_metadata?.name as string | undefined) ?? user?.email ?? "";

  const visaoGeralProps = {
    userName,
    investimento,
    previousInvestimento,
  };

  const marketingProps = {
    investimento,
    previousInvestimento,
    leads,
    previousLeads,
    cpl,
    previousCpl,
    evolution,
    creativeRanking,
    videoRetention: computeVideoRetention(videoRetentionRows),
  };

  return <DashboardTabs visaoGeral={visaoGeralProps} marketing={marketingProps} />;
}
