from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os

from parser import parse_python_file, extract_source_lines, walk_repo, resolve_local_imports, hash_function_code
from claude_client import client
from vector_store import find_related_functions, index_code_map
from drift_tracker import check_drift, save_doc
from diagram import build_mermaid_graph

app = FastAPI(title="AI Code Intelligence API")

# Allow Vite dev server during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve built React frontend (production)
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")


class SummarizeRequest(BaseModel):
    file_path: str
    function_name: str
    file_content: str | None = None  # if provided, skip filesystem read


class RelatedRequest(BaseModel):
    file_path: str
    function_name: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/summarize")
def summarize(req: SummarizeRequest):
    if req.file_content:
        # Parse from uploaded content instead of filesystem
        import tempfile, os as _os
        with tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w", encoding="utf-8") as tmp:
            tmp.write(req.file_content)
            tmp_path = tmp.name
        try:
            parsed = parse_python_file(tmp_path)
            target = next(
                (f for f in parsed["functions"] if f["name"] == req.function_name),
                None
            )
            if not target:
                raise HTTPException(
                    status_code=404,
                    detail=f"Function '{req.function_name}' not found in uploaded file"
                )
            source_code = extract_source_lines(tmp_path, target["start_line"], target["end_line"])
        finally:
            _os.unlink(tmp_path)
    else:
        parsed = parse_python_file(req.file_path)
        target = next(
            (f for f in parsed["functions"] if f["name"] == req.function_name),
            None
        )
        if not target:
            raise HTTPException(
                status_code=404,
                detail=f"Function '{req.function_name}' not found in {req.file_path}"
            )
        source_code = extract_source_lines(
            req.file_path, target["start_line"], target["end_line"]
        )
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": f"In 3-4 sentences, explain what this Python function does:\n\n{source_code}"
        }]
    )
    return {
        "file": req.file_path,
        "function": req.function_name,
        "class": target["class"],
        "start_line": target["start_line"],
        "end_line": target["end_line"],
        "source_code": source_code,
        "summary": response.content[0].text,
    }


@app.post("/index")
def index_repo():
    code_map = walk_repo(".")
    count = index_code_map(code_map)
    return {"indexed_functions": count}


@app.post("/related")
def related(req: RelatedRequest):
    parsed = parse_python_file(req.file_path)
    target = next(
        (f for f in parsed["functions"] if f["name"] == req.function_name),
        None
    )
    if not target:
        raise HTTPException(status_code=404, detail="Function not found")

    query_text = (
        f"Function '{target['name']}' in file {req.file_path}"
        + (f", part of class {target['class']}" if target["class"] else "")
    )

    results = find_related_functions(query_text, n_results=6)

    def normalize(path):
        return path.lstrip(".\\/").lstrip("./")

    results = [
        r for r in results
        if not (
            normalize(r["metadata"]["file"]) == normalize(req.file_path)
            and r["metadata"]["function"] == req.function_name
        )
    ]

    return {"query_function": req.function_name, "related": results[:5]}


@app.post("/docs-check")
def docs_check():
    drifted = check_drift(".")
    results = []

    for item in drifted:
        source_code = item["source_code"]
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": (
                    "Write a concise Python docstring (just the docstring content, "
                    "no code) for this function:\n\n" + source_code
                )
            }]
        )
        doc_text = response.content[0].text

        save_doc(
            file_path=item["file"],
            function_name=item["function"],
            class_name=item["class"] or "",
            code_hash=hash_function_code(source_code),
            doc=doc_text,
        )

        results.append({
            "file": item["file"],
            "function": item["function"],
            "class": item["class"],
            "status": item["status"],
            "generated_doc": doc_text,
        })

    return {"processed": len(results), "results": results}


@app.get("/diagram")
def get_diagram():
    code_map = walk_repo(".")
    graph = resolve_local_imports(code_map)
    mermaid_code = build_mermaid_graph(graph)
    return {"mermaid": mermaid_code}


# Mount static assets (JS/CSS/images) and serve index.html for all other routes.
# This block only activates when the frontend has been built (dist/ exists).
if os.path.isdir(FRONTEND_DIST):
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")),
        name="assets",
    )

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        index = os.path.join(FRONTEND_DIST, "index.html")
        return FileResponse(index)
