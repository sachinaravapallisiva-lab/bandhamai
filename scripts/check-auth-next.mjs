import { ALLOWED_NEXT_PATHS, safeNextPath } from "../lib/next-path.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

assert(safeNextPath("/matches") === "/matches", "matches is allowed");
assert(safeNextPath("/chat") === "/chat", "chat is allowed");
assert(safeNextPath("/profile/new") === "/profile/new", "profile create is allowed");
assert(safeNextPath("/account") === "/account", "account is allowed");
assert(safeNextPath("/?tab=matches") === "/?tab=matches", "home tab query is allowed");
assert(safeNextPath("/?tab=chat") === "/?tab=chat", "chat tab query is allowed");
assert(safeNextPath("/?tab=evil") === "/", "unknown tab query is stripped");
assert(safeNextPath("//evil.com") === "/", "protocol-relative blocked");
assert(safeNextPath("/\\evil.com") === "/", "backslash blocked");
assert(safeNextPath("https://evil.com") === "/", "absolute url blocked");
assert(safeNextPath("/login?next=https://evil.com") === "/login", "nested query dropped");
assert(safeNextPath("/ok-but-not-listed") === "/", "unknown path blocked");
assert(safeNextPath("/matches/../evil") === "/", "dot-dot rejected");
assert(safeNextPath(" /matches") === "/matches", "trim still allowlisted");
assert(safeNextPath("/matches#foo") === "/matches", "hash stripped");
assert(safeNextPath(null) === "/", "null falls back");

ALLOWED_NEXT_PATHS.forEach(function (path) {
  assert(safeNextPath(path) === path, "allowlist member " + path);
});

console.log("auth next-path allowlist ok", { allowed: ALLOWED_NEXT_PATHS.length });
