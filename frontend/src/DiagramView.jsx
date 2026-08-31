import { useState, useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "dark" });

function DiagramView() {
  const [mermaidSyntax, setMermaidSyntax]   = useState(null);
  const [error, setError]                   = useState(null);
  const [loading, setLoading]               = useState(false);
  const [fileCount, setFileCount]           = useState(null);
  const [uploadedName, setUploadedName]     = useState(null);
  const diagramRef                          = useRef(null);

  const runDiagram = async (fetchFn, label) => {
    setLoading(true); setError(null); setMermaidSyntax(null);
    setFileCount(null); setUploadedName(label || null);
    try {
      const data = await fetchFn();
      setMermaidSyntax(data.mermaid);
      if (data.file_count !== undefined) setFileCount(data.file_count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadProject = () =>
    runDiagram(async () => {
      const res = await fetch("/diagram");
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed"); }
      return res.json();
    }, null);

  const handleZipUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    runDiagram(async () => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/diagram/upload", { method: "POST", body: form });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed"); }
      return res.json();
    }, file.name);
    e.target.value = "";
  };

  useEffect(() => {
    if (!mermaidSyntax || !diagramRef.current) return;
    const render = async () => {
      try {
        const id = "diagram-" + Date.now();
        const { svg } = await mermaid.render(id, mermaidSyntax);
        diagramRef.current.innerHTML = svg;
      } catch (err) {
        setError("Failed to render diagram: " + err.message);
      }
    };
    render();
  }, [mermaidSyntax]);

  return (
    <div className="w-full max-w-5xl space-y-4">

      {/* Card */}
      <div className="rounded-2xl overflow-hidden" style={{background:"#111827",border:"1px solid rgba(255,255,255,0.08)"}}>

        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-4" style={{borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
          <div>
            <h2 className="text-base font-bold text-white">Module Dependency Graph</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Visual map of file-to-file imports. Load this project or upload any Python codebase as a <span className="text-indigo-400 font-medium">.zip</span>.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLoadProject}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-40"
              style={{background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"white",boxShadow:"0 2px 12px rgba(99,102,241,0.35)"}}
            >
              {loading && !uploadedName ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Loading…
                </>
              ) : (
                <>🔍 This Project</>
              )}
            </button>

            <label
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${loading ? "opacity-40 pointer-events-none" : "hover:brightness-110"}`}
              style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",color:"#d1d5db"}}
            >
              {loading && uploadedName ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Uploading…
                </>
              ) : (
                <>📦 Upload .zip</>
              )}
              <input type="file" accept=".zip" className="hidden" onChange={handleZipUpload} disabled={loading} />
            </label>
          </div>
        </div>

        {/* Uploaded badge */}
        {uploadedName && mermaidSyntax && (
          <div className="px-6 py-2 flex items-center gap-2" style={{borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(99,102,241,0.06)"}}>
            <span className="text-sm">📦</span>
            <span className="text-xs font-mono text-indigo-300">{uploadedName}</span>
            {fileCount !== null && (
              <span className="text-xs px-2 py-0.5 rounded-full text-indigo-400" style={{background:"rgba(99,102,241,0.2)"}}>
                {fileCount} Python files
              </span>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 rounded-xl px-4 py-3 text-sm flex items-start gap-2" style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",color:"#fca5a5"}}>
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Diagram area */}
        <div
          ref={diagramRef}
          className={`overflow-x-auto p-6 transition-all ${
            mermaidSyntax ? "" : "flex items-center justify-center"
          }`}
          style={{minHeight: mermaidSyntax ? "auto" : "320px", background:"#0d1117"}}
        >
          {!mermaidSyntax && !error && (
            <div className="text-center space-y-3">
              <div className="text-5xl">🗺️</div>
              <div>
                <p className="text-sm font-semibold text-gray-400">
                  {loading ? "Generating diagram…" : "No diagram loaded yet"}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {loading ? "Analysing imports and building graph…" : 'Click "This Project" or upload a .zip to visualize a codebase'}
                </p>
              </div>
              {loading && (
                <div className="flex justify-center">
                  <svg className="animate-spin w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default DiagramView;
