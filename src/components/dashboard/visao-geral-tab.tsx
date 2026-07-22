import { WalletIcon } from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { Greeting } from "@/components/dashboard/greeting";

const currencyFormat = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type VisaoGeralTabProps = {
  userName: string;
  investimento: number;
  previousInvestimento: number;
};

export function VisaoGeralTab({ userName, investimento, previousInvestimento }: VisaoGeralTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <Greeting name={userName} />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Investimento Total"
          value={investimento}
          previousValue={previousInvestimento}
          format={currencyFormat}
          icon={WalletIcon}
        />
        <MetricCard label="CAC" value={null} pendingReason="Aguardando integração com o CRM" />
        <MetricCard label="Receita Total" value={null} pendingReason="Aguardando integração com o CRM" />
      </div>
    </div>
  );
}
