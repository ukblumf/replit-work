import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ApiError, getOrderSummary, setAuthTokenGetter } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getStoredApiKey, setStoredApiKey } from '@/lib/api-key';

type Status = 'checking' | 'locked' | 'unlocked';

// Every request now needs a Bearer key (see stockApiAuth); the UI prompts for
// it once, verifies it against the real API, and stores it in localStorage.
// setAuthTokenGetter re-reads storage on every call, so once unlocked all
// generated hooks pick the key up automatically.
async function verifyKey(key: string): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await getOrderSummary({ headers: { Authorization: `Bearer ${key}` } });
    return { ok: true };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return { ok: false, message: 'Invalid API key.' };
    }
    return { ok: false, message: 'Could not reach the Ordering API. Try again.' };
  }
}

export function ApiKeyGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('checking');
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    setAuthTokenGetter(() => getStoredApiKey());

    const stored = getStoredApiKey();
    if (!stored) {
      setStatus('locked');
      return;
    }
    verifyKey(stored).then((result) => setStatus(result.ok ? 'unlocked' : 'locked'));
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const key = input.trim();
    if (!key) return;

    setIsVerifying(true);
    setError(null);
    const result = await verifyKey(key);
    setIsVerifying(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setStoredApiKey(key);
    setStatus('unlocked');
  }

  if (status === 'checking') return null;
  if (status === 'unlocked') return <>{children}</>;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Ordering — API Key Required</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                autoFocus
                autoComplete="off"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isVerifying || !input.trim()} className="w-full">
              {isVerifying ? 'Checking…' : 'Unlock'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
