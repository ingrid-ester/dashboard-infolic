import { HammerIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function ComercialTab() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <HammerIcon className="size-8 text-muted-foreground" />
        <p className="text-lg font-semibold">Em construção</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Essa aba depende da integração com o CRM do cliente, que ainda não foi configurada.
        </p>
      </CardContent>
    </Card>
  );
}
