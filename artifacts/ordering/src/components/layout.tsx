import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { PackageSearch, FileText, Settings, BookOpen, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Orders", icon: FileText },
  { href: "/orders/new", label: "New Order", icon: PackageSearch },
  { href: "/api-docs", label: "API Docs", icon: BookOpen },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-primary font-bold text-lg tracking-tight">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
                <PackageSearch size={18} />
              </div>
              ORDERING
            </div>
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {NAV_ITEMS.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Return to Service Manager"
            >
              <Home size={16} />
              <span className="hidden sm:inline">Service Manager</span>
            </a>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border">
              <span className="text-xs font-medium">AD</span>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
