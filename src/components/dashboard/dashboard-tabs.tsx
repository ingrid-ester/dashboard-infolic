"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { HandshakeIcon, LayoutDashboardIcon, MegaphoneIcon, MenuIcon } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisaoGeralTab } from "@/components/dashboard/visao-geral-tab";
import { MarketingTab } from "@/components/dashboard/marketing-tab";
import { ComercialTab } from "@/components/dashboard/comercial-tab";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { cn } from "@/lib/utils";

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
  const [navOpen, setNavOpen] = useState(false);

  return (
    <Tabs defaultValue="visao-geral" orientation="vertical" className="min-h-svh w-full flex-col md:flex-row">
      {/* Mobile top bar — the full sidebar becomes an off-canvas drawer below md, opened from here */}
      <div className="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Abrir menu"
          className="flex size-9 items-center justify-center rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent"
        >
          <MenuIcon className="size-5" />
        </button>
        <Image src="/logo-infolic.png" alt="Infolic" width={36} height={36} priority />
        <div className="size-9" />
      </div>

      {navOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 -translate-x-full flex-col justify-between border-r border-sidebar-border bg-sidebar px-4 py-6 transition-transform duration-200",
          navOpen && "translate-x-0",
          "md:static md:z-auto md:w-60 md:translate-x-0 md:transition-none",
        )}
      >
        <div className="flex flex-col gap-8">
          <Image src="/logo-infolic.png" alt="Infolic" width={110} height={110} priority className="hidden md:block" />

          <div className="flex flex-col gap-2">
            <span className="px-3 text-xs font-medium tracking-wide text-sidebar-foreground/50 uppercase">
              Menu
            </span>
            <TabsList className="flex-col items-stretch gap-1 bg-transparent p-0">
              {NAV_ITEMS.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  onClick={() => setNavOpen(false)}
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

      <div className="flex-1 overflow-x-hidden px-4 py-4 md:px-6 md:py-6">
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
