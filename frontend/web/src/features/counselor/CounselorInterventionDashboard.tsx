import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, ShieldCheck, Eye, EyeOff, Lock, Unlock, CheckCircle } from 'lucide-react';
import { encryptNote, decryptNote } from './encryption-utils';
import { CounselorInterventionNotes } from './CounselorInterventionNotes';

interface RiskAlert {
  id: string;
  student_id: string;
  anonymized_name: string;
  signal_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

interface Identity {
  id: string;
  full_name: string;
  email: string;
}

export const CounselorInterventionDashboard = () => {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [revealedIdentities, setRevealedIdentities] = useState<Record<string, Identity>>({});
  const [passphrase, setPassphrase] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Identity | null>(null);
  const [revealReason, setRevealReason] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/counselor/risk-alerts');
      const data = await res.json();
      setAlerts(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch alerts", error);
    }
  };

  const handleReveal = async (alertId: string) => {
    if (!revealReason.trim()) return;
    try {
      const res = await fetch(`/api/counselor/risk-alerts/${alertId}/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: revealReason }),
      });
      const data = await res.json();
      setRevealedIdentities(prev => ({ ...prev, [alertId]: data.identity }));
      setRevealReason("");
    } catch (error) {
      console.error("Reveal failed", error);
    }
  };

  const getSeverityColor = (sev: string) => {
    switch(sev) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-400 text-black';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Psychological Early Intervention Dashboard</h1>
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
          <ShieldCheck className="text-emerald-500 w-5 h-5" />
          <span className="text-sm font-medium">Safeguarding Mode Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {!selectedStudent ? (
          <Card className="lg:col-span-2 shadow-md">
          <CardHeader className="border-b bg-white">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="text-red-500 w-5 h-5" />
              Active Risk Signals (Anonymized)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b">
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Subject ID</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Signal Type</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Severity</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        {revealedIdentities[alert.id] ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{revealedIdentities[alert.id].full_name}</span>
                            <span className="text-xs text-slate-500">{revealedIdentities[alert.id].email}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-600 italic">
                            <Lock className="w-3 h-3" /> {alert.anonymized_name}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-medium">{alert.signal_type}</td>
                      <td className="p-4">
                        <Badge className={`${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {!revealedIdentities[alert.id] ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <Eye className="w-4 h-4" /> Reveal Identity
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Audit: Reason for Deanonymization</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <p className="text-sm text-slate-500">
                                  Identity reveal is logged for institutional safeguarding requirements. Explain why this move is necessary.
                                </p>
                                <Input 
                                  placeholder="e.g. Self-harm indicators detected in AI chat logs" 
                                  value={revealReason} 
                                  onChange={(e) => setRevealReason(e.target.value)} 
                                />
                                <Button className="w-full" onClick={() => handleReveal(alert.id)}>Log Audit & Reveal</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <div className="flex gap-2">
                             <Button 
                                variant="default" 
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => setSelectedStudent(revealedIdentities[alert.id])}
                             >
                                Open Case Journal
                             </Button>
                             <Button variant="ghost" size="sm">Dismiss Alert</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="lg:col-span-2 space-y-4">
            <Button variant="ghost" onClick={() => setSelectedStudent(null)} className="mb-4">
                ← Back to Risk Alerts
            </Button>
            <CounselorInterventionNotes identity={selectedStudent} passphrase={passphrase} />
        </div>
      )}

        <div className="space-y-6">
          <Card className="shadow-sm border-emerald-100 bg-emerald-50/10">
            <CardHeader>
              <CardTitle className="text-md flex items-center gap-2">
                <Unlock className="w-4 h-4 text-emerald-600" />
                Case Encryption Key
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="passphrase">Enter Secret Case Passphrase</Label>
                <p className="text-[10px] text-slate-400 leading-tight mb-2">
                  Plaintext notes never leave your browser. This key is used for client-side AES-256 decryption.
                </p>
                <Input 
                  id="passphrase" 
                  type="password" 
                  className="bg-white" 
                  placeholder="Private intervention key" 
                  value={passphrase} 
                  onChange={(e) => setPassphrase(e.target.value)} 
                />
                <p className="text-[10px] italic text-orange-600 mt-1 font-medium">
                  Forgotten keys result in permanent note data loss.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-md">Recent Interventions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
                  <CheckCircle className="text-orange-500 w-5 h-5 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Self-Harm Signal #4492</h4>
                    <p className="text-xs text-slate-600 mt-1">Intervened: Counselor Smith</p>
                    <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <CheckCircle className="text-slate-300 w-5 h-5 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Anxiety Alert #1102</h4>
                    <p className="text-xs text-slate-600 mt-1">Awaiting counselor assignment</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
