import os


def build_mermaid_graph(dependency_graph):
    """
    Converts a dependency graph like:
    { "./main.py": ["./parser.py", "./claude_client.py"] }
    into Mermaid.js flowchart syntax.
    """
    lines = ["graph TD"]

    def clean_name(path):
        # Turn "./main.py" into a safe node id like "main_py"
        name = os.path.basename(path)
        return name.replace(".", "_").replace("-", "_")

    def display_label(path):
        return os.path.basename(path)

    node_ids = {}
    for file_path in dependency_graph.keys():
        node_id = clean_name(file_path)
        node_ids[file_path] = node_id
        lines.append(f'    {node_id}["{display_label(file_path)}"]')

    for file_path, deps in dependency_graph.items():
        source_id = node_ids[file_path]
        for dep in deps:
            if dep in node_ids:
                target_id = node_ids[dep]
                lines.append(f"    {source_id} --> {target_id}")

    return "\n".join(lines)


if __name__ == "__main__":
    import json

    with open("dependency_graph.json", "r", encoding="utf-8") as f:
        graph = json.load(f)

    mermaid_code = build_mermaid_graph(graph)
    print(mermaid_code)