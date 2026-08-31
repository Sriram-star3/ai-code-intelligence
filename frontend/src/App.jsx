import { useState } from "react";
import DiagramView from "./DiagramView";

const TABS = [
  { id: "summarize", label: "Summarize", icon: "⚡" },
  { id: "diagram",   label: "Architecture", icon: "🗺️" },
];

function App() {
  const [tab, setTab] = useState("summarize");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [functions, setFunctions]       = useState([]);
  const [functionName, setFunctionName] = useState("");
  const [filePath, setFilePath]         = useState("");
  const [result, setResult]             = useState(null);
  const [error, setError]               = useState(null);
  const [loading, setLoading]           = useState(false);

  const extractFunctions = (text) =>
    [...text.matchAll(/^def\s+(\w+)\s*\(/gm)].map((m) => m[1]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      const fns = extractFunctions(content);
      setUploadedFile({ name: file.name, content });
      setFunctions(fns);
      setFunctionName(fns[0] || "");
      setResult(null);
      setError(null);
      setFilePath("");
    };
    reader.readAsText(file);
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setFunctions([]);
    setFunctionName("");
    setResult(null);
    setError(null);
  };

  const handleSummarize = async () => {
    if (!functionName.trim()) { setError("Please enter a function name."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const body = uploadedFile
        ? { file_path: uploadedFile.name, function_name: functionName, file_content: uploadedFile.content }
        : { file_path: filePath, function_name: functionName };
      const response = await fetch("/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Something went wrong");
      }
      setResult(await response.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{background:"#0b0d14"}}>

      {/* ── Header ── */}
      <header style={{background:"linear-gradient(135deg,#0f1729 0%,#111827 60%,#0f1729 100%)",borderBottom:"1px solid rgba(99,102,241,0.2)"}}>
        <div className="max-w-5xl mx-auto px-6 py-7">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">🧠</span>
                <h1 className="text-xl font-bold text-white tracking-tight">AI Code Intelligence</h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-indigo-300 border border-indigo-500/40" style={{background:"rgba(99,102,241,0.15)"}}>
                  Gemini
                </span>
              </div>
              <p className="text-sm text-gray-400 ml-9">
                Understand any Python codebase — summaries, diagrams, drift detection &amp; semantic search.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" style={{boxShadow:"0 0 6px #34d399"}}></span>
              <span className="text-xs text-emerald-400 font-medium">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tab Bar ── */}
      <div style={{background:"#111827",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <div className="max-w-5xl mx-auto px-6 py-2 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === t.id
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
              style={tab === t.id ? {background:"rgba(99,102,241,0.2)",boxShadow:"0 0 0 1px rgba(99,102,241,0.4)",color:"#a5b4fc"} : {}}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col items-center py-10 px-4">
        {tab === "diagram" ? (
          <DiagramView />
        ) : (
          <div className="w-full max-w-xl space-y-4">

            {/* Card */}
            <div className="rounded-2xl p-6 space-y-5" style={{background:"#111827",border:"1px solid rgba(255,255,255,0.08)"}}>

              {/* Card heading */}
              <div>
                <h2 className="text-base font-bold text-white">Function Summarizer</h2>
                <p className="text-xs text-gray-500 mt-0.5">Upload a Python file and get an AI explanation of any function.</p>
              </div>

              {/* File upload */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{color:"#6366f1"}}>
                  Python File
                </label>
                {uploadedFile ? (
                  <div className="flex items-center justify-between rounded-lg px-4 py-2.5" style={{background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.35)"}}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">📄</span>
                      <span className="text-sm font-medium text-indigo-300 truncate">{uploadedFile.name}</span>
                      {functions.length > 0 && (
                        <span className="shrink-0 text-xs px-1.5 py-0.5 rounded text-indigo-400" style={{background:"rgba(99,102,241,0.2)"}}>
                          {functions.length} fn{functions.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <button onClick={handleClearFile} className="ml-3 text-xs text-gray-500 hover:text-red-400 transition-colors shrink-0">
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center w-full rounded-xl py-6 cursor-pointer transition-all group" style={{border:"2px dashed rgba(99,102,241,0.3)",background:"rgba(99,102,241,0.04)"}}>
                      <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📂</span>
                      <span className="text-sm text-gray-400 group-hover:text-indigo-300 transition-colors">
                        Click to upload a <span className="font-semibold text-indigo-400">.py file</span>
                      </span>
                      <span className="text-xs text-gray-600 mt-1">from anywhere on your computer</span>
                      <input type="file" accept=".py" className="hidden" onChange={handleFileChange} />
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px" style={{background:"rgba(255,255,255,0.07)"}}></div>
                      <span className="text-xs text-gray-600">or enter server path</span>
                      <div className="flex-1 h-px" style={{background:"rgba(255,255,255,0.07)"}}></div>
                    </div>
                    <input
                      type="text"
                      value={filePath}
                      onChange={(e) => setFilePath(e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none transition-all"
                      style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}
                      onFocus={e => e.target.style.border="1px solid rgba(99,102,241,0.5)"}
                      onBlur={e => e.target.style.border="1px solid rgba(255,255,255,0.1)"}
                      placeholder="e.g. test_target.py"
                    />
                  </div>
                )}
              </div>

              {/* Function selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{color:"#6366f1"}}>
                  Function Name
                </label>
                {functions.length > 0 ? (
                  <select
                    value={functionName}
                    onChange={(e) => setFunctionName(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-gray-200 outline-none transition-all"
                    style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}
                  >
                    {functions.map((fn) => (
                      <option key={fn} value={fn} style={{background:"#1f2937"}}>{fn}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={functionName}
                    onChange={(e) => setFunctionName(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none transition-all"
                    style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}
                    onFocus={e => e.target.style.border="1px solid rgba(99,102,241,0.5)"}
                    onBlur={e => e.target.style.border="1px solid rgba(255,255,255,0.1)"}
                    placeholder="e.g. add"
                  />
                )}
              </div>

              {/* Submit button */}
              <button
                onClick={handleSummarize}
                disabled={loading || (!uploadedFile && !filePath)}
                className="w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 disabled:opacity-40"
                style={{
                  background: loading || (!uploadedFile && !filePath)
                    ? "rgba(99,102,241,0.3)"
                    : "linear-gradient(135deg,#6366f1,#4f46e5)",
                  color: "white",
                  boxShadow: loading || (!uploadedFile && !filePath) ? "none" : "0 4px 20px rgba(99,102,241,0.4)"
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Summarizing…
                  </span>
                ) : "✨ Summarize"}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2" style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",color:"#fca5a5"}}>
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="rounded-2xl overflow-hidden" style={{border:"1px solid rgba(255,255,255,0.08)"}}>

                {/* Result header */}
                <div className="px-5 py-3 flex items-center justify-between" style={{background:"rgba(99,102,241,0.12)",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Result</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Lines {result.start_line}–{result.end_line}</span>
                    {result.class && (
                      <span className="px-1.5 py-0.5 rounded font-mono text-indigo-400" style={{background:"rgba(99,102,241,0.2)"}}>
                        {result.class}
                      </span>
                    )}
                  </div>
                </div>

                {/* Source code */}
                <div style={{background:"#0d1117"}}>
                  <div className="flex items-center gap-1.5 px-4 py-2" style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/70"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/70"></span>
                    <span className="ml-3 text-xs text-gray-600">{result.function} — {result.file}</span>
                  </div>
                  <pre className="text-xs p-4 overflow-x-auto leading-relaxed" style={{color:"#7ee787",fontFamily:"'Fira Code','Courier New',monospace"}}>
                    {result.source_code}
                  </pre>
                </div>

                {/* AI Summary */}
                <div className="px-5 py-4" style={{background:"#111827"}}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{color:"#6366f1"}}>AI Summary</span>
                    <span className="text-xs px-1.5 py-0.5 rounded text-indigo-400 font-medium" style={{background:"rgba(99,102,241,0.15)"}}>Gemini</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{result.summary}</p>
                </div>

              </div>
            )}

          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="text-center py-4" style={{borderTop:"1px solid rgba(255,255,255,0.06)",background:"#0b0d14"}}>
        <span className="text-xs text-gray-600">AI Code Intelligence &nbsp;·&nbsp; Phase 5 &nbsp;·&nbsp; Powered by Gemini &nbsp;·&nbsp;
          <a href="https://github.com/Sriram-star3/ai-code-intelligence" target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-400 transition-colors">GitHub</a>
        </span>
      </footer>

    </div>
  );
}

export default App;
