"use client";

import { useEffect, useState } from "react";

function getGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

// Computed client-side (not on the server) so the greeting matches the
// viewer's own local time of day, not the server's.
export function Greeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    // Runs once on mount, client-only — reads the viewer's local time,
    // which the server can't know, so this can't be computed during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(getGreeting(new Date().getHours()));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">
        {greeting ?? "Olá"}, <span className="text-primary">{name}</span>
      </h1>
      <p className="text-sm text-muted-foreground">Bem-vindo ao Dashboard da Infolic</p>
    </div>
  );
}
