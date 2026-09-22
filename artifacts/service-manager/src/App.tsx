import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  BookOpen,
  Boxes,
  ClipboardList,
  Wrench,
  X,
} from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type ActiveDocs = { title: string; href: string };

function Home() {
  const [activeDocs, setActiveDocs] = useState<ActiveDocs | null>(null);

  const toggleDocs = (title: string, href: string) => {
    setActiveDocs((current) => (current?.href === href ? null : { title, href }));
  };

  return (
    <main className="service-shell">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1280px] flex-col px-5 sm:px-8 lg:px-12">
        <header className="service-reveal flex items-center justify-between border-b border-[hsl(var(--border)/0.8)] py-6 sm:py-7">
          <div className="flex items-center gap-4">
            <div className="service-mark" aria-hidden="true">
              <Wrench className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <p className="mt-0.5 text-lg font-semibold tracking-[-0.03em] text-[hsl(var(--primary))]">
                Service Manager
              </p>
            </div>
          </div>
          <p className="hidden font-mono text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] sm:block">
            Internal workspace
          </p>
        </header>

        <section className="flex flex-1 flex-col justify-start pb-12 pt-10 sm:pb-16 sm:pt-14 lg:pt-16">
          <div className="grid w-full gap-4 md:grid-cols-3">
            <ServiceCard
              className="service-reveal service-reveal-delay-1"
              icon={<Boxes className="h-6 w-6" strokeWidth={1.8} />}
              number="01 / STOCK"
              title="Stock Control"
              description="Track inventory, movements, and what needs attention next."
              href="/stock-control/"
              apiReferenceHref="/stock-control/api-reference"
              testId="link-stock-control"
              isDocsOpen={activeDocs?.href === '/stock-control/api-reference'}
              onToggleDocs={toggleDocs}
            />
            <ServiceCard
              className="service-reveal service-reveal-delay-2"
              icon={<ClipboardList className="h-6 w-6" strokeWidth={1.8} />}
              number="02 / ORDER"
              title="Ordering"
              description="Keep purchasing moving from request through delivery."
              href="/ordering/"
              apiReferenceHref="/ordering/api-reference"
              testId="link-ordering"
              isDocsOpen={activeDocs?.href === '/ordering/api-reference'}
              onToggleDocs={toggleDocs}
            />
            <ServiceCard
              className="service-reveal service-reveal-delay-3"
              icon={<Wrench className="h-6 w-6" strokeWidth={1.8} />}
              number="03 / JOBS"
              title="Job Manager"
              description="Plan the day, coordinate work, and keep jobs on course."
              href="/jobs/"
              apiReferenceHref="/jobs/api-reference"
              testId="link-job-manager"
              isDocsOpen={activeDocs?.href === '/jobs/api-reference'}
              onToggleDocs={toggleDocs}
            />
          </div>

          {activeDocs && (
            <div className="service-reveal mt-6 w-full overflow-hidden rounded-sm border border-[hsl(var(--card-border))] bg-[hsl(var(--card)/0.88)] shadow-[0_1.2rem_2.5rem_hsl(211_65%_11%/0.06)]">
              <div className="flex items-center justify-between border-b border-[hsl(var(--border)/0.8)] px-5 py-3">
                <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
                  {activeDocs.title} <span className="text-[hsl(var(--accent))]">·</span> API Reference
                </p>
                <button
                  type="button"
                  onClick={() => setActiveDocs(null)}
                  aria-label="Close API reference"
                  className="rounded-sm p-1 text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--primary))]"
                >
                  <X className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </div>
              <iframe
                key={activeDocs.href}
                src={activeDocs.href}
                title={`${activeDocs.title} API Reference`}
                className="h-[75vh] w-full bg-[hsl(var(--background))]"
              />
            </div>
          )}
        </section>

        <footer className="service-reveal service-reveal-delay-3 flex items-center justify-between border-t border-[hsl(var(--border)/0.8)] py-5">
          <p className="font-mono text-[0.63rem] font-bold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
            Select a service to continue
          </p>
          <span className="hidden items-center gap-2 font-mono text-[0.63rem] font-bold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] sm:flex">
            Service Manager <span className="text-[hsl(var(--accent))]">•</span> Internal tools
          </span>
        </footer>
      </div>
    </main>
  );
}

type ServiceCardProps = {
  className: string;
  icon: ReactNode;
  number: string;
  title: string;
  description: string;
  href: string;
  apiReferenceHref: string;
  testId: string;
  isDocsOpen: boolean;
  onToggleDocs: (title: string, href: string) => void;
};

function ServiceCard({
  className,
  icon,
  number,
  title,
  description,
  href,
  apiReferenceHref,
  testId,
  isDocsOpen,
  onToggleDocs,
}: ServiceCardProps) {
  return (
    <div className={`service-card group p-6 sm:p-7 ${className}`}>
      <a
        className="relative z-10 block"
        href={href}
        data-testid={testId}
        aria-label={`Open ${title}`}
      >
        <div className="flex items-start justify-between">
          <div className="service-card__icon" aria-hidden="true">
            {icon}
          </div>
          <span className="service-card__number">{number}</span>
        </div>
        <div className="mt-6">
          <h2 className="text-2xl font-semibold tracking-[-0.045em] text-[hsl(var(--primary))]">
            {title}
          </h2>
          <p className="mt-2 max-w-[18rem] text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            {description}
          </p>
        </div>
      </a>
      <button
        type="button"
        onClick={() => onToggleDocs(title, apiReferenceHref)}
        aria-expanded={isDocsOpen}
        data-testid={`${testId}-api-reference`}
        className={`service-card__arrow relative z-10 mt-7 ${isDocsOpen ? 'text-[hsl(var(--accent))]' : ''}`}
      >
        {isDocsOpen ? 'Close API Reference' : 'Open API Reference'}
        <BookOpen className="h-4 w-4" strokeWidth={2.2} />
      </button>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
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
