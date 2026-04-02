import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, Smartphone, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const ParentConnect = () => {
  const [token, setToken] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(600);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(600);

  const fetchToken = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/student/connection-token');
      if (!response.ok) throw new Error('Failed to fetch token');
      const data = await response.json();
      setToken(data.token);
      setExpiresIn(data.expires_in);
      setTimeLeft(data.expires_in);
    } catch (error) {
      console.error('Error fetching connection token:', error);
      toast.error('Could not generate connection QR code');
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

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden border-2 border-primary/10 shadow-lg bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
          <Smartphone className="text-primary w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold">Connect Parent</CardTitle>
        <CardDescription>
          Ask your parent to scan this QR code using their Lumina app to link your accounts.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6 pb-8">
        <div className="relative p-6 bg-white rounded-2xl shadow-inner group">
          {loading ? (
            <div className="w-[200px] h-[200px] flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : token && timeLeft > 0 ? (
            <div className="relative">
              <QRCodeSVG 
                value={token} 
                size={200} 
                level="H"
                includeMargin={true}
                className="transition-transform group-hover:scale-105 duration-300"
              />
              <div className="absolute inset-0 border-4 border-primary/20 rounded-lg pointer-events-none" />
            </div>
          ) : (
            <div className="w-[200px] h-[200px] flex flex-col items-center justify-center text-center space-y-2 text-muted-foreground">
              <Smartphone className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">QR Expired</p>
              <Button variant="ghost" size="sm" onClick={fetchToken}>
                Regenerate
              </Button>
            </div>
          )}
        </div>

        <div className="w-full space-y-4">
          <div className="flex items-center justify-between px-4 py-2 bg-background/50 rounded-full border border-primary/10">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valid for</span>
            <span className={`text-sm font-mono font-bold ${timeLeft < 60 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <Button 
            className="w-full h-12 font-semibold text-lg shadow-md hover:shadow-xl transition-all"
            variant="outline"
            onClick={fetchToken}
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh QR Code
          </Button>
        </div>

        <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10 text-left">
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
