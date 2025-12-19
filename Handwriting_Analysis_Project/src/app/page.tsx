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
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-blue-600 tracking-tight">Handwriting Analyst</h1>
          <p className="mt-2 text-lg text-gray-600">Upload handwritten PDFs for instant transcription and scoring.</p>
        </header>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold mb-4">New Analysis</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                    <>
                      <svg className="w-8 h-8 mb-4 text-green-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 font-semibold">{file.name}</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-500">PDF (Handwritten)</p>
                    </>
                  )}
                </div>
                <input id="dropzone-file" type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className={`w-full py-3 px-4 rounded-xl text-white font-medium text-lg transition-all ${loading || !file ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'}`}
            >
              {loading ? 'Analyzing...' : 'Analyze Document'}
            </button>
          </form>
        </section>

        {result && (
          <section className="bg-white p-8 rounded-2xl shadow-lg border border-blue-100 ring-1 ring-blue-50">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-2">Transcribed Text</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[150px] whitespace-pre-wrap font-mono text-sm">
                  {result.transcribedText}
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-2">Score</h3>
                  <div className="flex items-center">
                    <span className={`text-5xl font-black ${result.score > 80 ? 'text-green-500' : result.score > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {result.score}
                    </span>
                    <span className="text-2xl text-gray-400 ml-2">/ 100</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-2">Feedback</h3>
                  <p className="text-gray-700 leading-relaxed">{result.feedback}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-gray-800">History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Filename</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Transcript Preview</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.filename}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${item.score > 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {item.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 truncate max-w-xs">{item.transcribedText.substring(0, 50)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {history.length === 0 && <p className="text-center py-4 text-gray-400">No previous analyses found.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
