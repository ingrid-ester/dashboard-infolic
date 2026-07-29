import { MousePointerClickIcon, WalletIcon } from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { EvolutionChart } from "@/components/dashboard/evolution-chart";
import { PendingCard } from "@/components/dashboard/pending-card";
import { RankingTable } from "@/components/dashboard/ranking-table";

type CreativeRankingRow = { creativeName: string; investimento: number; leads: number; cpl: number | null };
type EvolutionPoint = { data: string; leads: number; vendas: number; sqls: number };
type VideoRetentionMetric = {
  adName: string;
  campaignName: string;
  plays: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  p100: number;
};

type MarketingTabProps = {
  investimento: number;
  previousInvestimento: number;
  leads: number;
  previousLeads: number;
  cpl: number | null;
  previousCpl: number | null;
  evolution: EvolutionPoint[];
  creativeRanking: CreativeRankingRow[];
  videoRetention: VideoRetentionMetric[];
};

const currencyFormat = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const pctFormat = (value: number) => `${value.toFixed(1)}%`;

export function MarketingTab({
  investimento,
  previousInvestimento,
  leads,
  previousLeads,
  cpl,
  previousCpl,
  evolution,
  creativeRanking,
  videoRetention,
}: MarketingTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
        <MetricCard
          label="Investimento"
          value={investimento}
          previousValue={previousInvestimento}
          format={currencyFormat}
          icon={WalletIcon}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            label="Leads (conversas iniciadas)"
            value={leads}
            previousValue={previousLeads}
            icon={MousePointerClickIcon}
          />
          <MetricCard
            label="CPL"
            value={cpl}
            previousValue={previousCpl}
            format={currencyFormat}
            invert
            pendingReason="Sem leads no período"
          />
          <MetricCard label="SQLs" value={null} pendingReason="Aguardando integração com o CRM" />
          <MetricCard label="CPSQL" value={null} pendingReason="Aguardando integração com o CRM" />
        </div>
      </div>

      <EvolutionChart data={evolution} />

      <PendingCard title="Status dos Leads" message="Aguardando integração com o CRM." />

      <RankingTable
        title="Ranking de Criativos"
        rows={creativeRanking}
        rankBadge
        columns={[
          { header: "Criativo", render: (r) => r.creativeName, sortValue: (r) => r.creativeName },
          {
            header: "Leads",
            align: "right",
            render: (r) => r.leads.toLocaleString("pt-BR"),
            sortValue: (r) => r.leads,
          },
          {
            header: "Investimento",
            align: "right",
            render: (r) => currencyFormat(r.investimento),
            sortValue: (r) => r.investimento,
          },
          {
            header: "CPL",
            align: "right",
            render: (r) => (r.cpl !== null ? currencyFormat(r.cpl) : "—"),
            sortValue: (r) => r.cpl ?? -1,
          },
        ]}
      />

      <RankingTable
        title="Retenção de Vídeo (Anúncios Ativos)"
        rows={videoRetention}
        emptyMessage="Nenhum anúncio de vídeo ativo no momento."
        columns={[
          { header: "Anúncio", render: (r) => r.adName, sortValue: (r) => r.adName },
          { header: "Campanha", render: (r) => r.campaignName, sortValue: (r) => r.campaignName },
          {
            header: "Plays",
            align: "right",
            render: (r) => r.plays.toLocaleString("pt-BR"),
            sortValue: (r) => r.plays,
          },
          { header: "25%", align: "right", render: (r) => pctFormat(r.p25), sortValue: (r) => r.p25 },
          { header: "50%", align: "right", render: (r) => pctFormat(r.p50), sortValue: (r) => r.p50 },
          { header: "75%", align: "right", render: (r) => pctFormat(r.p75), sortValue: (r) => r.p75 },
          { header: "95%", align: "right", render: (r) => pctFormat(r.p95), sortValue: (r) => r.p95 },
          { header: "100%", align: "right", render: (r) => pctFormat(r.p100), sortValue: (r) => r.p100 },
        ]}
      />
    </div>
  );
}
