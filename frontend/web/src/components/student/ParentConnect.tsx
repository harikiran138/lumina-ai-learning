import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, Smartphone, CheckCircle2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export const ParentConnect = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [copied, setCopied] = useState(false);

  const fetchToken = async (isRefresh = false) => {
    setLoading(true);
    try {
      const endpoint = isRefresh ? '/api/student/refresh-link-code' : '/api/student/connection-token';
      const method = isRefresh ? 'POST' : 'GET';
      
      const response = await fetch(endpoint, { method });
      if (!response.ok) throw new Error('Failed to fetch token');
      const data = await response.json();
      setToken(data.token);
      setTimeLeft(data.expires_in);
    } catch (error) {
      console.error('Error fetching connection token:', error);
      toast.error('Could not generate connection code');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, []);

  useEffect(() => {
    if (!token || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [token, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const copyToClipboard = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden border-2 border-primary/10 shadow-lg bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
          <Smartphone className="text-primary w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold">Connect Parent</CardTitle>
        <CardDescription>
          Give this code to your parent. They should enter it in their Lumina app to link your accounts.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6 pb-8">
        <div className="w-full relative p-8 bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center min-h-[160px] group">
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : token && timeLeft > 0 ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="text-4xl font-black tracking-widest text-primary font-mono select-all bg-primary/5 px-6 py-3 rounded-xl border border-primary/10">
                {token}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyToClipboard}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-2 text-muted-foreground">
              <Smartphone className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Code Expired</p>
              <Button variant="ghost" size="sm" onClick={() => fetchToken(true)}>
                Generate New Code
              </Button>
            </div>
          )}
        </div>

        <div className="w-full space-y-4">
          <div className="flex items-center justify-between px-4 py-2 bg-background/50 rounded-full border border-primary/10 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valid for</span>
            <span className={`text-sm font-mono font-bold ${timeLeft < 60 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
              {formatTime(Math.max(0, timeLeft))}
            </span>
          </div>

          <Button 
            className="w-full h-12 font-semibold text-lg shadow-md hover:shadow-xl transition-all"
            variant="outline"
            onClick={() => fetchToken(true)}
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Code
          </Button>
        </div>

        <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10 text-left scale-95 opacity-90 transition-all hover:scale-100 hover:opacity-100">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Linking allows your parent to track progress, set goals, and view assignments. 
            The connection is secure and permanent until removed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
