'use client';

import { useState, useEffect } from 'react';

type AnalysisResult = {
  id: string;
  filename: string;
  transcribedText: string;
  score: number;
  feedback: string;
  createdAt: string;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Analysis failed');

      const data = await res.json();
      setResult(data);
      fetchHistory(); // Refresh history
    } catch (error) {
      alert('Error analyzing file');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-text p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-black text-primary tracking-tight font-display">Handwriting Analyst</h1>
          <p className="mt-2 text-lg text-text-secondary">Upload handwritten PDFs for instant transcription and scoring.</p>
        </header>

        <section className="bg-surface-elevated p-6 rounded-2xl shadow-sm border border-border">
          <h2 className="text-2xl font-bold mb-4 font-display">New Analysis</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-border border-dashed rounded-lg cursor-pointer bg-surface hover:bg-surface-elevated transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-primary" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="mb-2 text-sm text-text font-semibold">{file.name}</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mb-4 border border-border">
                        <svg className="w-6 h-6 text-text-muted" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                        </svg>
                      </div>
                      <p className="mb-2 text-sm text-text-secondary"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-text-muted">PDF (Handwritten)</p>
                    </>
                  )}
                </div>
                <input id="dropzone-file" type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className={`w-full py-3 px-4 rounded-xl text-black dark:text-black font-black text-lg uppercase tracking-wider transition-all ${loading || !file ? 'bg-surface-elevated text-text-muted cursor-not-allowed border border-border' : 'bg-primary shadow-lg hover:shadow-primary/30 hover:scale-[1.01]'}`}
            >
              {loading ? 'Analyzing...' : 'Analyze Document'}
            </button>
          </form>
        </section>

        {result && (
          <section className="bg-surface-elevated p-8 rounded-2xl shadow-xl border border-primary/20">
            <h2 className="text-3xl font-black mb-6 text-text font-display">Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm uppercase tracking-widest text-text-muted font-black mb-2">Transcribed Text</h3>
                <div className="bg-surface p-4 rounded-lg border border-border min-h-[150px] whitespace-pre-wrap font-mono text-sm text-text-secondary">
                  {result.transcribedText}
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm uppercase tracking-widest text-text-muted font-black mb-2">Score</h3>
                  <div className="flex items-center">
                    <span className={`text-5xl font-black ${result.score > 80 ? 'text-primary' : result.score > 50 ? 'text-primary' : 'text-primary' /* Keeping focused on theme-aware colors, could use semantic error if needed */}`}>
                      {result.score}
                    </span>
                    <span className="text-2xl text-text-muted ml-2">/ 100</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm uppercase tracking-widest text-text-muted font-black mb-2">Feedback</h3>
                  <p className="text-text-secondary leading-relaxed font-sans">{result.feedback}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="bg-surface-elevated p-6 rounded-2xl shadow-sm border border-border">
          <h2 className="text-xl font-bold mb-4 font-display">History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-text-secondary">
              <thead className="text-xs text-text-muted uppercase bg-surface">
                <tr>
                  <th className="px-6 py-3 border-b border-border">Date</th>
                  <th className="px-6 py-3 border-b border-border">Filename</th>
                  <th className="px-6 py-3 border-b border-border">Score</th>
                  <th className="px-6 py-3 border-b border-border">Transcript Preview</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="bg-surface-elevated border-b border-border hover:bg-surface transition-colors">
                    <td className="px-6 py-4">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-text">{item.filename}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md text-xs font-black bg-primary/10 text-primary border border-primary/20">
                        {item.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 truncate max-w-xs">{item.transcribedText.substring(0, 50)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {history.length === 0 && <p className="text-center py-8 text-text-muted font-sans italic">No previous analyses found.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
