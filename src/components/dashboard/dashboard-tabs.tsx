"use client";

import { Suspense } from "react";
import { HandshakeIcon, LayoutDashboardIcon, MegaphoneIcon } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisaoGeralTab } from "@/components/dashboard/visao-geral-tab";
import { MarketingTab } from "@/components/dashboard/marketing-tab";
import { ComercialTab } from "@/components/dashboard/comercial-tab";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

type DashboardTabsProps = {
  visaoGeral: React.ComponentProps<typeof VisaoGeralTab>;
  marketing: React.ComponentProps<typeof MarketingTab>;
};

const NAV_ITEMS = [
  { value: "visao-geral", label: "Visão Geral", icon: LayoutDashboardIcon },
  { value: "marketing", label: "Marketing", icon: MegaphoneIcon },
  { value: "comercial", label: "Comercial", icon: HandshakeIcon },
] as const;

export function DashboardTabs({ visaoGeral, marketing }: DashboardTabsProps) {
  return (
    <Tabs defaultValue="visao-geral" orientation="vertical" className="min-h-svh w-full">
      <div className="flex w-60 shrink-0 flex-col justify-between border-r border-sidebar-border bg-sidebar px-4 py-6">
        <div className="flex flex-col gap-8">
          <span className="px-1 text-lg font-semibold text-sidebar-foreground">Infolic</span>

          <div className="flex flex-col gap-2">
            <span className="px-3 text-xs font-medium tracking-wide text-sidebar-foreground/50 uppercase">
              Menu
            </span>
            <TabsList className="flex-col items-stretch gap-1 bg-transparent p-0">
              {NAV_ITEMS.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="justify-start gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/70 after:hidden data-active:bg-primary/15 data-active:text-sidebar-foreground"
                >
                  <Icon className="size-4 text-primary" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        <SignOutButton />
      </div>

      <div className="flex-1 overflow-x-hidden px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <Suspense>
            <PeriodFilter />
          </Suspense>

          <TabsContent value="visao-geral">
            <VisaoGeralTab {...visaoGeral} />
          </TabsContent>
          <TabsContent value="marketing">
            <MarketingTab {...marketing} />
          </TabsContent>
          <TabsContent value="comercial">
            <ComercialTab />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
}
