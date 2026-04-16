"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Loader2,
  BookOpen,
  Calendar,
  User,
  Hash
} from 'lucide-react';
import { RealAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function EnrollmentPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const api = RealAPI.getInstance();

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.redeemEnrollmentCode(code.trim().toUpperCase());
      if (response.error) {
        setError(response.error);
        toast.error(response.error);
      } else {
        setResult(response.data);
        toast.success("Successfully enrolled!");
        // We could redirect to dashboard or just show success
      }
    } catch (err: any) {
      setError("Failed to redeem code. Please check your internet connection.");
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-lumina-primary to-blue-400 bg-clip-text text-transparent">
          Student Enrollment
        </h1>
        <p className="text-muted-foreground">
          Enter your unique enrollment code provided by your department to join your batch.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Redeem Form */}
        <Card className="bg-white/50 backdrop-blur-xl border-white/20 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-lumina-primary/5 to-transparent border-b border-white/10">
            <CardTitle className="text-xl flex items-center gap-2">
              <QrCode className="w-5 h-5 text-lumina-primary" />
              Redeem Code
            </CardTitle>
            <CardDescription>
              Verify your batch and subjects using the secure 8-character code.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleRedeem} className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="EX: LUM-X92B"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="text-lg font-mono uppercase tracking-widest h-12 border-lumina-primary/20 focus:border-lumina-primary transition-all pr-12"
                  maxLength={10}
                  disabled={loading || !!result}
                />
                {loading && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="w-6 h-6 animate-spin text-lumina-primary" />
                  </div>
                )}
              </div>
              
              {!result && (
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg bg-lumina-primary hover:bg-lumina-primary/90 group"
                  disabled={loading || !code.trim()}
                >
                  Join Batch
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-sm"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Results / Info Area */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              <Card className="bg-green-50/50 border-green-100 shadow-sm border-2">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-green-800">Enrollment Verified</CardTitle>
                  <CardDescription className="text-green-700/70">
                    You have been successfully added to the batch.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/80 rounded-lg border border-green-100">
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Program</p>
                      <p className="font-medium text-green-900">{result.batch?.department_name || 'Engineering'}</p>
                    </div>
                    <div className="p-3 bg-white/80 rounded-lg border border-green-100">
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Batch</p>
                      <p className="font-medium text-green-900">{result.batch?.name || 'Batch A'}</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-green-200 hover:bg-green-100 text-green-800"
                    onClick={() => window.location.href = '/student/dashboard'}
                  >
                    Go to Dashboard
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="info"
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-lumina-primary" />
                  What happens next?
                </h3>
                <ul className="space-y-3">
                  {[
                    "Join your specific academic batch instantly",
                    "Access your official course curriculum",
                    "Link with your assigned faculty instructors",
                    "Start tracking your attendance and grades"
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-lumina-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-lumina-primary">{i+1}</span>
                      </div>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Enrollment codes are case-sensitive and can only be used once. If your code is not working, 
                  please contact your Department HOD or College Administrator.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
