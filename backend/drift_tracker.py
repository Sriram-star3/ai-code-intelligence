import sqlite3
from parser import walk_repo, extract_source_lines, hash_function_code

DB_PATH = "drift.db"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS function_hashes (
            file TEXT,
            function TEXT,
            class_name TEXT,
            code_hash TEXT,
            doc TEXT,
            PRIMARY KEY (file, function, class_name)
        )
    """)
    conn.commit()
    conn.close()


def check_drift(repo_path="."):
    """
    Walks the repo, hashes every function's current code,
    and compares against stored hashes to detect drift.
    Returns a list of functions that are NEW or CHANGED.
    """
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    code_map = walk_repo(repo_path)
    drifted = []

    for entry in code_map:
        file_path = entry["file"]
        for func in entry["functions"]:
            class_name = func["class"] or ""
            source = extract_source_lines(file_path, func["start_line"], func["end_line"])
            current_hash = hash_function_code(source)

            cursor.execute(
                "SELECT code_hash, doc FROM function_hashes WHERE file=? AND function=? AND class_name=?",
                (file_path, func["name"], class_name)
            )
            row = cursor.fetchone()

            if row is None:
                # Never seen before — needs a doc generated
                drifted.append({
                    "file": file_path,
                    "function": func["name"],
                    "class": func["class"],
                    "start_line": func["start_line"],
                    "end_line": func["end_line"],
                    "status": "new",
                    "source_code": source,
                })
            elif row[0] != current_hash:
                # Code changed since last doc was generated
                drifted.append({
                    "file": file_path,
                    "function": func["name"],
                    "class": func["class"],
                    "start_line": func["start_line"],
                    "end_line": func["end_line"],
                    "status": "drifted",
                    "old_doc": row[1],
                    "source_code": source,
                })

    conn.close()
    return drifted


def save_doc(file_path, function_name, class_name, code_hash, doc):
    """Store/update the doc + hash after generating documentation."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        INSERT INTO function_hashes (file, function, class_name, code_hash, doc)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(file, function, class_name)
        DO UPDATE SET code_hash=excluded.code_hash, doc=excluded.doc
    """, (file_path, function_name, class_name or "", code_hash, doc))
    conn.commit()
    conn.close()


if __name__ == "__main__":
    import json
    drifted = check_drift(".")
    print(json.dumps(drifted, indent=2))
    print(f"\n{len(drifted)} function(s) need documentation (new or drifted).")