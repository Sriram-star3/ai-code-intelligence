import { useState, useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "default" });

function DiagramView() {
  const [mermaidSyntax, setMermaidSyntax] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const diagramRef = useRef(null);

  const handleLoad = async () => {
    setLoading(true);
    setError(null);
    setMermaidSyntax(null);

    try {
      const response = await fetch("/diagram");
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to load diagram");
      }
      const data = await response.json();
      setMermaidSyntax(data.mermaid);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
            Visual map of file-to-file imports in the indexed codebase.
          </p>
        </div>
        <button
          onClick={handleLoad}
          disabled={loading}
          className="shrink-0 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "Loading…" : "Load Diagram"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Diagram area — always rendered so the ref is stable */}
      <div
        ref={diagramRef}
        className={`overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all ${
          mermaidSyntax ? "min-h-0" : "min-h-64 flex items-center justify-center"
        }`}
      >
        {!mermaidSyntax && !error && (
          <p className="text-sm text-gray-400 select-none">
            {loading ? "Fetching diagram\u2026" : 'Click \u201cLoad Diagram\u201d to visualize the architecture.'}
          </p>
        )}
      </div>
    </div>
  );
}

export default DiagramView;
