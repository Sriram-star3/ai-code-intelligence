import { useState, useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "default" });

function DiagramView() {
  const [mermaidSyntax, setMermaidSyntax] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileCount, setFileCount] = useState(null);
  const [uploadedName, setUploadedName] = useState(null);
  const diagramRef = useRef(null);

  const runDiagram = async (fetchFn, label) => {
    setLoading(true);
    setError(null);
    setMermaidSyntax(null);
    setFileCount(null);
    setUploadedName(label || null);

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
    // Reset input so same file can be re-uploaded
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
    <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-7 w-full max-w-4xl space-y-5">
      {/* Card header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Module Dependency Graph</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Visual map of file-to-file imports. Load the deployed project or upload any Python codebase as a <span className="font-medium">.zip</span>.
          </p>
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleLoadProject}
            disabled={loading}
            className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {loading && !uploadedName ? "Loading…" : "This Project"}
          </button>

          <label className={`flex items-center gap-1.5 bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer ${loading ? "opacity-50 pointer-events-none" : ""}`}>
            {loading && uploadedName ? "Uploading…" : "Upload .zip"}
            <input
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleZipUpload}
              disabled={loading}
            />
          </label>
        </div>
      </div>

      {/* Uploaded file badge */}
      {uploadedName && mermaidSyntax && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded font-mono">{uploadedName}</span>
          {fileCount !== null && <span>{fileCount} Python files mapped</span>}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Diagram area */}
      <div
        ref={diagramRef}
        className={`overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all ${
          mermaidSyntax ? "min-h-0" : "min-h-64 flex items-center justify-center"
        }`}
      >
        {!mermaidSyntax && !error && (
          <p className="text-sm text-gray-400 select-none">
            {loading
              ? "Generating diagram\u2026"
              : 'Click \u201cThis Project\u201d or upload a .zip to visualize a codebase.'}
          </p>
        )}
      </div>
    </div>
  );
}

export default DiagramView;
