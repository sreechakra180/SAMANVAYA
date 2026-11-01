import re

_PHONE_STRIP = re.compile(r"[ \-().]")
_PHONE_MOBILE   = re.compile(r"^\+91[6-9]\d{9}$")
_PHONE_TOLLFREE = re.compile(r"^\+91(1800|1860)\d{4,7}$")
_PHONE_HELPLINE = re.compile(r"^\+91(1\d{3})$")
_UPI   = re.compile(r"^[a-z0-9.\-_]{2,256}@[a-z]{2,64}$")
_URL   = re.compile(r"^https://[a-z0-9.\-]+\.[a-z]{2,}(/\S*)?$")
_SENDER = re.compile(r"^[A-Z]{6}$")

def canonicalise(kind: str, raw: str) -> str | None:
    if raw is None:
        return None
    s = str(raw).strip()
    if not s:
        return None
    if kind == "phone":
        s = _PHONE_STRIP.sub("", s)
        if s.startswith("00"):
            s = "+" + s[2:]
        if s.startswith("0") and len(s) == 11:
            s = "+91" + s[1:]
        if s.startswith("91") and len(s) == 12:
            s = "+" + s
        if not s.startswith("+"):
            s = "+91" + s
        if _PHONE_MOBILE.match(s) or _PHONE_TOLLFREE.match(s) or _PHONE_HELPLINE.match(s):
            return s
        return None
    if kind == "upi":
        s = s.lower().replace(" ", "")
        return s if _UPI.match(s) else None
    if kind == "url":
        s = s.lower()
        if s.startswith("http://"):
            s = "https://" + s[7:]
        if s.startswith("https://www."):
            s = "https://" + s[12:]
        s = s.split("?", 1)[0].rstrip("/")
        return s if _URL.match(s) else None
    if kind == "sender_id":
        s = s.upper().strip()
        if "-" in s:
            s = re.sub(r"^[A-Z]{2}-", "", s)
        elif len(s) == 8 and s.isalpha():
            s = s[2:]
        return s if _SENDER.match(s) else None
    return None

def mask(kind: str, canonical: str, distinct: int = 0) -> str:
    if not canonical:
        return ""
    if canonical in ("1930", "+911930", "1909", "+911909"):
        return canonical
    if kind == "phone":
        return canonical[:6] + "XXXXX" + canonical[-2:] if len(canonical) >= 10 else canonical
    if kind == "upi":
        local, _, dom = canonical.partition("@")
        if len(local) <= 2:
            return (local[0] if local else "") + "***@" + dom
        return local[:2] + "***" + local[-1] + "@" + dom
    if kind == "url":
        host = canonical.replace("https://", "", 1).split("/", 1)[0]
        return host[:3] + "***" + host[3:8] if len(host) > 5 else canonical
    if kind == "sender_id":
        if len(canonical) == 6 and canonical.isalpha() and canonical.isupper():
            return canonical
        return canonical[:2] + "***"
    return canonical
