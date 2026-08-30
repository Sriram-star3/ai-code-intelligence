import { useState } from "react";
import DiagramView from "./DiagramView";

const TABS = [
  { id: "summarize", label: "Summarize" },
  { id: "diagram", label: "Architecture Diagram" },
];

function App() {
  const [tab, setTab] = useState("summarize");
  const [filePath, setFilePath] = useState("test_target.py");
  const [functionName, setFunctionName] = useState("add");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: filePath,
          function_name: functionName,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Something went wrong");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">AI Code Intelligence</h1>
            <span className="text-xs font-medium bg-blue-500 text-white px-2 py-0.5 rounded-full">
              Gemini
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            Understand your codebase with AI — summaries, semantic search, drift detection &amp; architecture diagrams.
          </p>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center py-10 px-4">
        {tab === "diagram" ? (
          <DiagramView />
        ) : (
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-7 w-full max-w-lg space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                File Path
              </label>
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. test_target.py"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                Function Name
              </label>
              <input
                type="text"
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. add"
              />
            </div>

            <button
              onClick={handleSummarize}
              disabled={loading}
              className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "Summarizing…" : "Summarize"}
            </button>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {result && (
              <div className="pt-2 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                    Source Code
                  </p>
                  <pre className="bg-gray-950 text-green-400 text-xs p-4 rounded-lg overflow-x-auto leading-relaxed">
                    {result.source_code}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                    AI Summary
                  </p>
                  <p className="text-gray-800 text-sm bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg leading-relaxed">
                    {result.summary}
                  </p>
                </div>
                <div className="text-xs text-gray-400 pt-1">
                  Lines {result.start_line}–{result.end_line}
                  {result.class && (
                    <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                      {result.class}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200 bg-white">
        AI Code Intelligence &mdash; Phase 5
      </footer>
    </div>
  );
}

export default App;
