import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Camera, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ChildScannerProps {
  onSuccess?: (childId: string) => void;
  onClose?: () => void;
}

const QrScanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then((mod) => mod.Scanner),
  { ssr: false }
);

interface DetectedBarcode {
  rawValue: string;
}

export const ChildScanner: React.FC<ChildScannerProps> = ({ onSuccess, onClose }) => {
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ child_id: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (!window.isSecureContext && !isLocalhost) {
      setError('QR scanner requires HTTPS in production. Open this page over https:// and try again.');
      setScanning(false);
    }
  }, []);

  const handleScan = async (detectedCodes: DetectedBarcode[]) => {
    const scannedCode = detectedCodes?.[0]?.rawValue;

    if (scannedCode && scanning && !loading) {
      setScanning(false);
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/parent/connection/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: scannedCode }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.detail || 'Failed to connect');
        }

        setSuccessData({ child_id: result.child_id });
        toast.success('Successfully connected to student!');
        if (onSuccess) onSuccess(result.child_id);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
        setScanning(true); // Allow retry
      } finally {
        setLoading(false);
      }
    }
  };

  const handleError = (err: any) => {
    console.error('Scanner error:', err);
    setError('Camera access denied or unavailable. Allow camera permission in your browser settings and reload this page.');
    setScanning(false);
  };

  const resetScanner = () => {
    setError(null);
    setSuccessData(null);
    setScanning(true);
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-primary/10">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Scan Student QR
          </CardTitle>
          <CardDescription>Position the student's QR code in the frame</CardDescription>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-black/5 flex items-center justify-center border-4 border-dashed border-primary/20">
          {successData ? (
            <div className="flex flex-col items-center justify-center text-center space-y-4 p-8 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-foreground">Connected!</h3>
                <p className="text-sm text-muted-foreground">Successfully linked to child ID:</p>
                <code className="text-xs font-mono bg-muted p-1 rounded">{successData.child_id}</code>
              </div>
              <Button onClick={onClose} className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white">
                Finish
              </Button>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center text-center space-y-4 p-8">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold">Scanner Unavailable</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button variant="outline" onClick={resetScanner} className="w-full mt-4">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {scanning && (
                <QrScanner
                  scanDelay={300}
                  onError={handleError}
                  onScan={handleScan}
                  formats={['qr_code']}
                  styles={{
                    container: { width: '100%', height: '100%' },
                    video: { width: '100%', height: '100%', objectFit: 'cover' },
                  }}
                  constraints={{
                    facingMode: 'environment'
                  }}
                />
              )}
              {loading && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin" />
                  <p className="font-semibold tracking-wide">Connecting...</p>
                </div>
              )}
              {/* Scan Overlays */}
              <div className="absolute inset-x-8 top-1/4 bottom-1/4 border-2 border-primary/50 rounded-xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]" />
              <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-primary/80 animate-scan pointer-events-none" />
            </>
          )}
        </div>
        
        {!successData && !error && (
          <div className="mt-6 flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">TIP</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Make sure the student has generated a fresh QR code in their settings. 
              The scanner will automatically detect and link the accounts once the code is captured.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
