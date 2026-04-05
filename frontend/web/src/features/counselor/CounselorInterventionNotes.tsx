import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Lock, FileText, Send, RefreshCw, XCircle, Unlock } from 'lucide-react';
import { encryptNote, decryptNote } from './encryption-utils';

interface Note {
  id: string;
  created_at: string;
  encrypted_blob: string;
  iv: string;
  auth_tag: string;
}

interface Identity {
  id: string;
  full_name: string;
}

export const CounselorInterventionNotes = ({ identity, passphrase }: { identity: Identity, passphrase: string }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [decryptedNotes, setDecryptedNotes] = useState<Record<string, string>>({});
  const [isEncrypting, setIsEncrypting] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [identity.id]);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/counselor/notes/${identity.id}`);
      const data = await res.json();
      setNotes(data);
    } catch (error) {
      console.error("Failed to fetch notes", error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !passphrase) return;
    setIsEncrypting(true);
    try {
      const encrypted = await encryptNote(newNote, passphrase);
      await fetch('/api/counselor/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: identity.id, ...encrypted }),
      });
      setNewNote("");
      fetchNotes();
    } catch (error) {
      console.error("Failed to add note", error);
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDecrypt = async (note: Note) => {
    if (!passphrase) return;
    const decrypted = await decryptNote(note.encrypted_blob, note.iv, note.auth_tag, passphrase);
    setDecryptedNotes(prev => ({ ...prev, [note.id]: decrypted }));
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-2 border-emerald-100 bg-white">
        <CardHeader className="bg-emerald-50/20 py-3">
          <CardTitle className="text-sm flex items-center gap-2 text-emerald-800">
            <Lock className="w-4 h-4" /> 
            Add Encrypted Session Note for {identity.full_name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <Textarea 
              placeholder="Case details, session intervention, safeguarding plan..." 
              className="resize-none min-h-[120px] bg-white border-emerald-100 focus:border-emerald-400 focus:ring-emerald-400"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-md">
              <span className="text-[10px] text-slate-500 font-mono">ENCRYPTION: AES-256-GCM / Client-Side Derived</span>
              <Button 
                onClick={handleAddNote} 
                disabled={!newNote.trim() || !passphrase || isEncrypting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
              >
                {isEncrypting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Log Encrypted Note
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            Session History ({notes.length})
        </h3>
        
        {notes.map((note) => (
          <Card key={note.id} className="bg-white hover:border-slate-300 transition-all shadow-sm">
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between items-center text-[11px] text-slate-400 mb-2">
                <span className="bg-slate-100 px-2 py-0.5 rounded uppercase font-bold tracking-tighter">Case Reference #{note.id.substring(0,6)}</span>
                <span>{new Date(note.created_at).toLocaleString()}</span>
              </div>
              
              {decryptedNotes[note.id] ? (
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100 italic font-medium">
                    {decryptedNotes[note.id]}
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 bg-slate-100/50 rounded-lg border border-dashed border-slate-200">
                    <XCircle className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-sm font-mono break-all text-slate-400 max-w-sm text-center mb-4 px-4 overflow-hidden h-6 opacity-30 select-none">
                        {note.encrypted_blob.substring(0, 50)}...
                    </p>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="bg-white border text-emerald-800 flex items-center gap-2"
                        onClick={() => handleDecrypt(note)}
                        disabled={!passphrase}
                    >
                        <Unlock className="w-4 h-4" /> Decrypt Note
                    </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {notes.length === 0 && (
            <div className="text-center py-12 text-slate-400 italic">No notes logged for this case.</div>
        )}
      </div>
    </div>
  );
};
