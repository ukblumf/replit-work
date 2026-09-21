import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowUpRight,
  Boxes,
  ClipboardList,
  Wrench,
} from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  return (
    <main className="service-shell">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1280px] flex-col px-5 sm:px-8 lg:px-12">
        <header className="service-reveal flex items-center justify-between border-b border-[hsl(var(--border)/0.8)] py-6 sm:py-7">
          <div className="flex items-center gap-4">
            <div className="service-mark" aria-hidden="true">
              <Wrench className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <p className="font-mono text-[0.63rem] font-bold uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
                Operations / 01
              </p>
              <p className="mt-0.5 text-lg font-semibold tracking-[-0.03em] text-[hsl(var(--primary))]">
                Service Manager
              </p>
            </div>
          </div>
          <p className="hidden font-mono text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] sm:block">
            Internal workspace
          </p>
        </header>

        <section className="flex flex-1 flex-col justify-center pb-12 pt-16 sm:pb-16 sm:pt-24 lg:pt-28">
          <div className="service-reveal max-w-3xl">
            <p className="mb-5 flex items-center gap-3 font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[hsl(var(--accent))]">
              <span className="h-px w-8 bg-[hsl(var(--accent))]" />
              One home base for the workday
            </p>
            <h1 className="max-w-4xl text-[clamp(3.2rem,8vw,7.4rem)] font-semibold leading-[0.89] tracking-[-0.075em] text-[hsl(var(--primary))]">
              The work
              <br />
              starts here<span className="text-[hsl(var(--accent))]">.</span>
            </h1>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3 lg:mt-20">
            <ServiceCard
              className="service-reveal service-reveal-delay-1"
              icon={<Boxes className="h-6 w-6" strokeWidth={1.8} />}
              number="01 / STOCK"
              title="Stock Control"
              description="Track inventory, movements, and what needs attention next."
              href="/stock-control/"
              testId="link-stock-control"
            />
            <ServiceCard
              className="service-reveal service-reveal-delay-2"
              icon={<ClipboardList className="h-6 w-6" strokeWidth={1.8} />}
              number="02 / ORDER"
              title="Ordering"
              description="Keep purchasing moving from request through delivery."
              href="/ordering/"
              testId="link-ordering"
            />
            <ServiceCard
              className="service-reveal service-reveal-delay-3"
              icon={<Wrench className="h-6 w-6" strokeWidth={1.8} />}
              number="03 / JOBS"
              title="Job Manager"
              description="Plan the day, coordinate work, and keep jobs on course."
              href="/jobs/"
              testId="link-job-manager"
            />
          </div>
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
  testId: string;
};

function ServiceCard({
  className,
  icon,
  number,
  title,
  description,
  href,
  testId,
}: ServiceCardProps) {
  return (
    <a
      className={`service-card group p-6 sm:p-7 ${className}`}
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
      <div className="relative z-10">
        <h2 className="text-2xl font-semibold tracking-[-0.045em] text-[hsl(var(--primary))]">
          {title}
        </h2>
        <p className="mt-2 max-w-[18rem] text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          {description}
        </p>
        <span className="service-card__arrow mt-7">
          Open workspace
          <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
        </span>
      </div>
    </a>
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
