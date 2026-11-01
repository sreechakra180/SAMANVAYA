import base64, json, sys, argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path
from nacl.signing import SigningKey

def main():
    ap = argparse.ArgumentParser(description="Generate Ed25519 signed licence for Community Scam Map")
    ap.add_argument("--licensee", required=True, help="Name of the licensee")
    ap.add_argument("--days", type=int, default=30, help="Licence validity in days")
    ap.add_argument("--out", default="licence.json", help="Path to output licence JSON file")
    ap.add_argument("--keydir", default=".", help="Directory to store or load keypair")
    args = ap.parse_args()

    keydir = Path(args.keydir)
    priv_path = keydir / "licence_privkey.b64"
    pub_path  = keydir / "licence_pubkey.b64"

    if priv_path.exists():
        sk = SigningKey(base64.b64decode(priv_path.read_text().strip()))
    else:
        sk = SigningKey.generate()
        priv_path.write_text(base64.b64encode(bytes(sk)).decode())
        pub_path.write_text(base64.b64encode(bytes(sk.verify_key)).decode())
        print(f"wrote {priv_path} (MOVE OFFLINE) and {pub_path}")

    payload = {
        "licensee": args.licensee,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=args.days)).isoformat()
    }
    sig = base64.b64encode(sk.sign(json.dumps(payload, sort_keys=True).encode()).signature).decode()
    Path(args.out).write_text(json.dumps({**payload, "signature": sig}, indent=2))
    print(f"wrote {args.out}")

if __name__ == "__main__":
    main()

