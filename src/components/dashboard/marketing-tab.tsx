import { MousePointerClickIcon, WalletIcon } from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { RankingTable } from "@/components/dashboard/ranking-table";

type CreativeRankingRow = { creativeName: string; investimento: number };
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
  videoRetention,
}: MarketingTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Investimento"
          value={investimento}
          previousValue={previousInvestimento}
          format={currencyFormat}
          icon={WalletIcon}
        />
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
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <MetricCard label="Contatos de Venda" value={null} pendingReason="Aguardando integração com o CRM" />
        <MetricCard label="MQLs" value={null} pendingReason="Aguardando integração com o CRM" />
        <MetricCard label="CPCV" value={null} pendingReason="Aguardando integração com o CRM" />
        <MetricCard label="CPMQL" value={null} pendingReason="Aguardando integração com o CRM" />
      </div>

      <RankingTable<CreativeRankingRow>
        title="Ranking de Criativos"
        rows={[]}
        emptyMessage="Aguardando integração com o CRM."
        columns={[
          { header: "Criativo", render: (r) => r.creativeName, sortValue: (r) => r.creativeName },
          {
            header: "Investimento",
            align: "right",
            render: (r) => currencyFormat(r.investimento),
            sortValue: (r) => r.investimento,
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
