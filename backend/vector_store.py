import chromadb

# Persistent client — saves to disk so embeddings survive between runs
client = chromadb.PersistentClient(path="./chroma_db")

collection = client.get_or_create_collection(name="code_functions")


def build_function_id(file_path, function_name, start_line):
    """Unique ID for each function, since names can repeat across files."""
    return f"{file_path}::{function_name}::{start_line}"


def index_code_map(code_map):
    """
    Takes the full code_map (list of file entries with functions),
    and adds every function into Chroma as a searchable embedding.
    """
    ids = []
    documents = []
    metadatas = []

    for entry in code_map:
        file_path = entry["file"]
        for func in entry["functions"]:
            func_id = build_function_id(file_path, func["name"], func["start_line"])

            # This is the text that gets embedded — the more descriptive, the better retrieval
            doc_text = (
                f"Function '{func['name']}' in file {file_path}"
                + (f", part of class {func['class']}" if func["class"] else "")
                + f", lines {func['start_line']}-{func['end_line']}."
            )

            ids.append(func_id)
            documents.append(doc_text)
            metadatas.append({
                "file": file_path,
                "function": func["name"],
                "class": func["class"] or "",
                "start_line": func["start_line"],
                "end_line": func["end_line"],
            })

    if ids:
        collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
        )

    return len(ids)


def find_related_functions(query_text, n_results=5):
    """
    Given a text query (e.g. a function's description or code),
    return the most semantically similar functions in the codebase.
    """
    results = collection.query(
        query_texts=[query_text],
        n_results=n_results,
    )

    related = []
    for i in range(len(results["ids"][0])):
        related.append({
            "id": results["ids"][0][i],
            "metadata": results["metadatas"][0][i],
            "distance": results["distances"][0][i],
        })

    return related


if __name__ == "__main__":
    import json

    with open("code_map.json", "r", encoding="utf-8") as f:
        code_map = json.load(f)

    count = index_code_map(code_map)
    print(f"Indexed {count} functions into Chroma.")

    # Quick test query
    test_query = "a function that adds two numbers together"
    results = find_related_functions(test_query, n_results=3)

    print(f"\nTop matches for: '{test_query}'")
    for r in results:
        print(f"  - {r['metadata']['function']} in {r['metadata']['file']} (distance: {r['distance']:.4f})")