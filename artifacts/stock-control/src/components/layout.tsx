import { Link, useLocation } from 'wouter';
import { Box, FileJson, PackageSearch } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: '/', label: 'Inventory', icon: PackageSearch },
    { href: '/api-reference', label: 'API Docs', icon: FileJson },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background font-sans text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-sidebar text-sidebar-foreground border-r-2 border-sidebar-border shrink-0 flex flex-col">
        <div className="p-6 md:p-8 flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-2 rounded-sm shadow-sm">
            <Box size={24} strokeWidth={2.5} />
          </div>
          <h1 className="font-black text-xl tracking-tight uppercase leading-tight">Stock<br/>Control</h1>
        </div>
        
        <nav className="flex-1 px-4 pb-6 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 font-bold uppercase tracking-wide group relative shrink-0",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground"
                )}
              >
                <item.icon size={20} className={cn("transition-colors", isActive ? "text-primary" : "group-hover:text-primary")} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 max-w-full relative">
        {/* Subtle noise texture for industrial feel */}
        <div className="pointer-events-none fixed inset-0 opacity-[0.015] mix-blend-multiply z-50" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
        <div className="flex-1 overflow-auto p-4 md:p-8 lg:p-12 relative z-10">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
