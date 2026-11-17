"""Validate snapshots without discarding suspicious records."""
import json
import math
from pathlib import Path
DIVISIONS = {"makuuchi", "juryo", "makushita", "sandanme", "jonidan", "jonokuchi"}
def validate(rows):
    errors, warnings, seen = [], [], set()
    for r in rows:
        ident = r.get("rikishi_id")
        if not ident or ident in seen: errors.append(f"duplicate/missing id: {ident}")
        seen.add(ident)
        if r.get("division") not in DIVISIONS: errors.append(f"unknown division: {ident}")
        for key, low, high in [("height_cm", 120, 230), ("weight_kg", 40, 350)]:
            value = r.get(key)
            if value is None: continue
            if type(value) not in (int, float) or not math.isfinite(value) or value <= 0: errors.append(f"invalid {key}: {ident}")
            elif not low <= value <= high: warnings.append(f"review {key}: {ident}={value}")
        for key in ("career_wins", "career_losses", "career_absences"):
            v = r.get(key)
            if v is not None and (type(v) is not int or v < 0): errors.append(f"invalid {key}: {ident}")
    if len({r.get("performance_as_of") for r in rows}) > 1: errors.append("inconsistent performance_as_of")
    return {"errors": errors, "warnings": warnings, "count": len(rows)}
if __name__ == "__main__":
    report = validate(json.loads(Path("data/real/snapshot.json").read_text())["records"])
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(bool(report["errors"]))
