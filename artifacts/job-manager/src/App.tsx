import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ChevronLeft,
  CircleHelp,
  Compass,
  Layers3,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type NavigationItem = {
  label: string;
  icon: typeof LayoutDashboard;
  active?: boolean;
};

const navigation: NavigationItem[] = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'Jobs', icon: Layers3 },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center ${compact ? 'justify-center' : 'gap-3'}`}>
      <div
        className="relative flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
        data-testid="brand-mark"
      >
        <span className="absolute size-3 rounded-[4px] border-[2px] border-current" />
        <span className="absolute -right-1 -top-1 size-2 rounded-full bg-sidebar-primary-foreground" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-[15px] font-extrabold tracking-[-0.03em] text-sidebar-foreground">
            Job Manager
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-sidebar-foreground/45">
            Operations workspace
          </p>
        </div>
      )}
    </div>
  );
}

function Sidebar({
  collapsed,
  onCollapse,
  onClose,
}: {
  collapsed: boolean;
  onCollapse: () => void;
  onClose: () => void;
}) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-300 md:relative md:translate-x-0 md:shadow-none ${
        collapsed ? 'md:w-[84px]' : ''
      }`}
      data-testid="sidebar-shell"
    >
      <div className={`flex h-[82px] items-center border-b border-sidebar-border/70 px-5 ${collapsed ? 'md:justify-center md:px-0' : 'justify-between'}`}>
        <Brand compact={collapsed} />
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground md:hidden"
          aria-label="Close navigation"
          data-testid="button-close-navigation"
        >
          <X className="size-4" strokeWidth={1.8} />
        </button>
      </div>

      <div className={`px-4 pt-7 ${collapsed ? 'md:px-3' : ''}`}>
        {!collapsed && (
          <p className="mb-3 px-2 font-mono text-[9px] uppercase tracking-[0.2em] text-sidebar-foreground/35">
            Workspace
          </p>
        )}
        <nav className="space-y-1" aria-label="Workspace navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`group flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold ${
                  collapsed ? 'md:justify-center md:px-0' : ''
                } ${
                  item.active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_hsl(var(--sidebar-primary))]'
                    : 'text-sidebar-foreground/45'
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className={`size-[17px] shrink-0 ${item.active ? 'text-sidebar-primary' : ''}`} strokeWidth={1.8} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.active && <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary" />}
              </div>
            );
          })}
        </nav>
      </div>

      <div className={`mt-auto border-t border-sidebar-border/70 p-4 ${collapsed ? 'md:px-3' : ''}`}>
        {!collapsed && (
          <div className="mb-5 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/45 p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-sidebar-primary" />
              <span className="font-mono text-[9px] uppercase tracking-[0.17em] text-sidebar-foreground/45">
                Shell status
              </span>
            </div>
            <p className="text-[12px] leading-relaxed text-sidebar-foreground/70">
              Your workspace is ready for its first record.
            </p>
          </div>
        )}
        <div className={`flex items-center ${collapsed ? 'md:justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-primary/15 font-mono text-[11px] font-medium text-sidebar-primary">
                OP
              </div>
              <div>
                <p className="text-[11px] font-semibold text-sidebar-foreground/80">Operations</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-sidebar-foreground/35">Team space</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onCollapse}
            className="hidden size-8 items-center justify-center rounded-lg text-sidebar-foreground/45 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground md:flex"
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            data-testid="button-toggle-sidebar"
          >
            {collapsed ? <PanelLeftOpen className="size-4" strokeWidth={1.8} /> : <PanelLeftClose className="size-4" strokeWidth={1.8} />}
          </button>
        </div>
      </div>
    </aside>
  );
}

function EmptyConstellation() {
  return (
    <div className="relative flex h-[190px] w-[190px] items-center justify-center" aria-hidden="true">
      <div className="absolute size-[190px] rounded-full border border-border/80" />
      <div className="absolute size-[132px] rounded-full border border-dashed border-border" />
      <div className="absolute size-[74px] rounded-full border border-accent/80 bg-accent/10" />
      <div className="relative flex size-11 items-center justify-center rounded-[14px] bg-primary text-primary-foreground shadow-lg">
        <BriefcaseBusiness className="size-5" strokeWidth={1.65} />
      </div>
      <span className="absolute right-[21px] top-[28px] size-2 rounded-full bg-accent" />
      <span className="absolute bottom-[30px] left-[26px] size-1.5 rounded-full bg-primary/35" />
      <span className="absolute left-[11px] top-[73px] size-1 rounded-full bg-primary/45" />
    </div>
  );
}

function Home() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="grain min-h-[100dvh] bg-background text-foreground">
      <div className="flex min-h-[100dvh]">
        {mobileNavOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-primary/35 backdrop-blur-[2px] md:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation overlay"
            data-testid="button-close-navigation-overlay"
          />
        )}
        <div className={`md:block ${mobileNavOpen ? 'block' : 'hidden'}`}>
          <Sidebar
            collapsed={collapsed}
            onCollapse={() => setCollapsed((value) => !value)}
            onClose={() => setMobileNavOpen(false)}
          />
        </div>

        <main className="workspace-grid min-w-0 flex-1 overflow-hidden">
          <header className="flex h-[82px] items-center justify-between border-b border-border/80 bg-background/75 px-5 backdrop-blur-md sm:px-8 lg:px-12">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground md:hidden"
                aria-label="Open navigation"
                data-testid="button-open-navigation"
              >
                <Menu className="size-4" strokeWidth={1.8} />
              </button>
              <div className="hidden items-center gap-2 text-[12px] text-muted-foreground sm:flex">
                <span>Workspace</span>
                <ChevronLeft className="size-3 rotate-180 text-muted-foreground/45" />
                <span className="font-semibold text-foreground">Overview</span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:hidden">
                Overview
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 sm:flex">
                <span className="size-1.5 rounded-full bg-[#4e9b7f]" />
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  System ready
                </span>
              </div>
              <div className="flex size-9 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-medium text-primary-foreground" data-testid="avatar-operations">
                OP
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
            <section className="shell-in delay-1 mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground" data-testid="text-page-kicker">
                  Operations / 01
                </p>
                <h1 className="max-w-[680px] text-balance text-[clamp(2.15rem,5vw,4.4rem)] font-extrabold leading-[0.98] tracking-[-0.065em] text-primary" data-testid="heading-overview">
                  A clear place to start the work.
                </h1>
              </div>
              <p className="max-w-[260px] pb-1 text-[13px] leading-relaxed text-muted-foreground sm:text-right">
                The foundation for your team&apos;s job operations, ready when you are.
              </p>
            </section>

            <section className="shell-in delay-2 relative overflow-hidden rounded-[22px] bg-primary p-6 text-primary-foreground shadow-xl sm:p-8 lg:p-10" data-testid="card-workspace-intro">
              <div className="absolute -right-20 -top-24 size-[340px] rounded-full border border-primary-foreground/10" />
              <div className="absolute -right-3 top-8 size-[190px] rounded-full border border-primary-foreground/10" />
              <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="max-w-[610px]">
                  <div className="mb-6 flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-primary-foreground/10">
                      <Compass className="size-3.5 text-sidebar-primary" strokeWidth={1.8} />
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary-foreground/55">
                      First look
                    </span>
                  </div>
                  <h2 className="max-w-[500px] text-[clamp(1.55rem,3vw,2.5rem)] font-bold leading-[1.06] tracking-[-0.045em]">
                    Your operating picture will live here.
                  </h2>
                  <p className="mt-4 max-w-[490px] text-[13px] leading-[1.75] text-primary-foreground/63">
                    This is a focused starter shell for the team. Once work is introduced, this space will give it a steady center.
                  </p>
                  <div className="mt-8 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-primary-foreground/42">
                    <span className="size-1.5 rounded-full bg-sidebar-primary" />
                    No records added
                  </div>
                </div>
                <div className="hidden pr-8 lg:block">
                  <EmptyConstellation />
                </div>
              </div>
            </section>

            <section className="shell-in delay-3 mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]" data-testid="section-empty-state">
              <div className="flex min-h-[268px] flex-col items-center justify-center rounded-[22px] border border-border bg-card/75 px-6 py-9 text-center shadow-sm">
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
                  <Layers3 className="size-5" strokeWidth={1.55} />
                </div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Nothing on the board</p>
                <h2 className="mt-3 text-[20px] font-bold tracking-[-0.035em] text-primary" data-testid="text-empty-state-title">
                  Your workspace is intentionally empty.
                </h2>
                <p className="mt-2 max-w-[390px] text-[13px] leading-relaxed text-muted-foreground" data-testid="text-empty-state-description">
                  There are no jobs or activity to show yet. This shell keeps the focus on what your team will add next.
                </p>
              </div>
              <div className="flex min-h-[268px] flex-col justify-between rounded-[22px] border border-border bg-card/45 p-6">
                <div>
                  <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-accent/20 text-primary">
                    <SlidersHorizontal className="size-[18px]" strokeWidth={1.7} />
                  </div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Designed to expand</p>
                  <h2 className="mt-3 max-w-[220px] text-[19px] font-bold leading-tight tracking-[-0.04em] text-primary">
                    Less noise. More signal.
                  </h2>
                </div>
                <div className="flex items-center justify-between border-t border-border/80 pt-4">
                  <span className="text-[12px] text-muted-foreground">Starter shell</span>
                  <ArrowUpRight className="size-4 text-muted-foreground/60" strokeWidth={1.7} />
                </div>
              </div>
            </section>

            <footer className="mt-9 flex flex-col gap-2 border-t border-border/70 pt-5 text-[10px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span className="font-mono uppercase tracking-[0.16em]">Job Manager / Internal workspace</span>
              <span className="flex items-center gap-1.5">
                <CircleHelp className="size-3.5" strokeWidth={1.7} />
                The quiet beginning
              </span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;