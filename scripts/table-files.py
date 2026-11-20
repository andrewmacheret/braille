"""Prints the given liblouis tables plus every file they include."""
import os
import re
import sys

tables_dir = sys.argv[1]
seen = set()
todo = list(sys.argv[2:])
while todo:
    name = todo.pop()
    if name in seen:
        continue
    seen.add(name)
    with open(os.path.join(tables_dir, name), encoding="utf-8", errors="replace") as f:
        for line in f:
            match = re.match(r"\s*include\s+(\S+)", line)
            if match:
                todo.append(match.group(1))

print("\n".join(sorted(seen)))
