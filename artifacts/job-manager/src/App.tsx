import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import { ApiKeyGate } from '@/components/api-key-gate';
import { Layout } from '@/components/layout';
import JobList from '@/pages/jobs/list';
import JobForm from '@/pages/jobs/form';
import JobDetail from '@/pages/jobs/detail';
import ApiReference from '@/pages/api-reference';

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={JobList} />
          <Route path="/new" component={JobForm} />
          <Route path="/api-reference" component={ApiReference} />
          <Route path="/:jobId" component={JobDetail} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Layout>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiKeyGate>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </ApiKeyGate>
    </QueryClientProvider>
  );
}

export default App;
