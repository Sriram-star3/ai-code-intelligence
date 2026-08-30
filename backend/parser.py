from tree_sitter_language_pack import get_parser
import os
import re
from tree_sitter_language_pack import get_parser
import os
import re
import hashlib  

def parse_python_file(file_path):
    with open(file_path, "rb") as f:
        code = f.read()
    parser = get_parser("python")
    tree = parser.parse(code)
    root = tree.root_node

    functions = []
    classes = []

    def walk(node, current_class=None):
        if node.type == "class_definition":
            name_node = node.child_by_field_name("name")
            class_name = name_node.text.decode() if name_node else "unknown"
            classes.append({
                "name": class_name,
                "start_line": node.start_point[0] + 1,
                "end_line": node.end_point[0] + 1,
            })
            for child in node.children:
                walk(child, current_class=class_name)
            return

        if node.type == "function_definition":
            name_node = node.child_by_field_name("name")
            functions.append({
                "name": name_node.text.decode() if name_node else "unknown",
                "class": current_class,
                "start_line": node.start_point[0] + 1,
                "end_line": node.end_point[0] + 1,
            })

        for child in node.children:
            walk(child, current_class=current_class)

    imports = []
    for node in root.children:
        if node.type in ("import_statement", "import_from_statement"):
            imports.append(node.text.decode())

    walk(root)

    return {
        "file": file_path,
        "classes": classes,
        "functions": functions,
        "imports": imports,
    }


def walk_repo(repo_path):
    code_map = []
    for dirpath, dirnames, filenames in os.walk(repo_path):
        dirnames[:] = [d for d in dirnames if d not in (
            "__pycache__", ".venv", "venv", "node_modules", ".git"
        )]
        for filename in filenames:
            if filename.endswith(".py"):
                full_path = os.path.join(dirpath, filename)
                try:
                    result = parse_python_file(full_path)
                    code_map.append(result)
                except Exception as e:
                    print(f"Failed to parse {full_path}: {e}")
    return code_map


def extract_source_lines(file_path, start_line, end_line):
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    # start_line/end_line are 1-indexed; slice is 0-indexed
    snippet = lines[start_line - 1:end_line]
    return "".join(snippet)


import re

def resolve_local_imports(code_map):
    """
    Given the full code_map, figure out which imports refer to
    OTHER FILES in this same project (local modules), and build
    a dependency graph: { file: [list of files it depends on] }
    """
    # Build a lookup: module name -> file path
    # e.g. "claude_client" -> "./claude_client.py"
    module_to_file = {}
    for entry in code_map:
        file_path = entry["file"]
        module_name = os.path.splitext(os.path.basename(file_path))[0]
        module_to_file[module_name] = file_path

    graph = {}
    for entry in code_map:
        file_path = entry["file"]
        depends_on = set()

        for imp in entry["imports"]:
            # crude parse: "from X import Y" or "import X"
            match = re.match(r"from\s+([\w.]+)\s+import", imp)
            if not match:
                match = re.match(r"import\s+([\w.]+)", imp)

            if match:
                imported_module = match.group(1).split(".")[0]
                if imported_module in module_to_file:
                    target_file = module_to_file[imported_module]
                    if target_file != file_path:
                        depends_on.add(target_file)

        graph[file_path] = sorted(depends_on)

    return graph


def hash_function_code(source_code):
    """Creates a short, stable fingerprint of a function's code."""
    normalized = "".join(source_code.split())  # ignore whitespace differences
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]

if __name__ == "__main__":
    import json
    result = walk_repo(".")
    graph = resolve_local_imports(result)

    output_path = "code_map.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    graph_path = "dependency_graph.json"
    with open(graph_path, "w", encoding="utf-8") as f:
        json.dump(graph, f, indent=2)

    print(f"Code map saved to {output_path}")
    print(f"Dependency graph saved to {graph_path}")
    print(f"Parsed {len(result)} files.")