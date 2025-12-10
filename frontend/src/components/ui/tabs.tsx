import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (v: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tabs({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) {
  const ctx = React.useMemo(() => ({ value, setValue: onValueChange }), [value, onValueChange]);
  return <TabsContext.Provider value={ctx}>{children}</TabsContext.Provider>;
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("inline-flex items-center gap-6 border-b border-border", className)} {...props} />
  );
}

export function TabsTrigger({ value, className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const ctx = React.useContext(TabsContext);
  const isActive = ctx?.value === value;
  return (
    <button
      onClick={() => ctx?.setValue(value)}
      className={cn(
        "relative bg-transparent text-muted-foreground font-medium pb-4 px-1 transition-colors",
        isActive && "text-primary",
        className
      )}
      {...props}
    >
      {children}
      <span
        className={cn(
          "pointer-events-none absolute left-0 -bottom-px h-0.5 w-full bg-primary transition-opacity",
          isActive ? "opacity-100" : "opacity-0"
        )}
      />
    </button>
  );
}

export function TabsContent({ value, children, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const ctx = React.useContext(TabsContext);
  if (ctx?.value !== value) return null;
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}


