"""Official collector intentionally disabled; no network or public-data writes."""
import json
import sys
from pathlib import Path

def main():
    rights = json.loads((Path(__file__).resolve().parents[1] / "data/rights.json").read_text())
    print(f"Rights status: {rights.get('status', 'unknown')}", file=sys.stderr)
    print("BLOCKED: collection is unavailable until permission, parser and quality review are complete.", file=sys.stderr)
    return 2

if __name__ == "__main__":
    raise SystemExit(main())
