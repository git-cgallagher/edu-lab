#!/usr/bin/env python3
"""
PreToolUse guardrail for AI coding agents (Claude Code-compatible).

Blocks destructive, irreversible, or guardrail-evading actions BEFORE they run.
  exit 2  -> block the tool call (the reason on stderr is shown to the agent)
  exit 0  -> allow

This is the *enforcement* layer. It is paired with the deny rules in
.claude/settings.json (defense in depth) and the "AI agent guardrails" section
in AGENTS.md (the human/agent-readable contract). Principle: do no harm, never
delete infrastructure state, and never edit the guardrails to get around them.
"""
import json
import re
import sys


def block(reason: str) -> None:
    sys.stderr.write(
        "BLOCKED by repo guardrail: " + reason + "\n"
        "This action is destructive, irreversible, or evades the guardrails. "
        "Do NOT try to work around it. If it is genuinely intended, stop and ask "
        "the human to run it manually.\n"
    )
    sys.exit(2)


try:
    data = json.load(sys.stdin)
except Exception:
    # Fail open on parse problems so we never wedge the agent; settings.json
    # deny rules still apply as the second layer.
    sys.exit(0)

tool = data.get("tool_name", "")
ti = data.get("tool_input", {}) or {}

# ── File-writing tools: protect state, secrets, and the guardrails themselves ──
if tool in ("Edit", "Write", "MultiEdit", "NotebookEdit"):
    p = (ti.get("file_path") or ti.get("notebook_path") or "").replace("\\", "/")
    if re.search(r"\.claude/(settings\.json|hooks/)", p):
        block("editing the guardrail config/hook (%s)." % p)
    if re.search(r"\.tfstate(\.|$)", p):
        block("writing to Terraform state (%s) — state must never be hand-edited." % p)
    sys.exit(0)

if tool != "Bash":
    sys.exit(0)

cmd = ti.get("command", "") or ""
c = " ".join(cmd.split())  # whitespace-normalized, ORIGINAL case (flags are case-sensitive)

# Case-sensitive flag checks (must run before the case-insensitive loop) ──
if re.search(r"\bgit\s+branch\s+-D\b", c):
    block("git branch -D (force-deletes an unmerged branch)  [command: %s]" % cmd.strip()[:200])

RULES = [
    # ── Terraform / OpenTofu: never destroy or surgically alter state ──
    (r"\b(terraform|tofu)\s+(destroy|apply\s+-destroy)\b", "terraform/tofu destroy"),
    (r"\b(terraform|tofu)\s+state\s+(rm|mv)\b", "terraform state rm/mv (state surgery)"),
    (r"\b(terraform|tofu)\s+force-unlock\b", "terraform force-unlock (can corrupt locked state)"),
    (r"\b(terraform|tofu)\s+workspace\s+delete\b", "terraform workspace delete"),
    # ── Deleting state / tfvars / secrets on disk ──
    (r"\brm\b.*\.tfstate", "deleting Terraform state file"),
    (r"\brm\b.*\.tfvars", "deleting a tfvars file (may be the only copy of inputs/secrets)"),
    # ── Recursive / forced filesystem destruction ──
    (r"\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r|-r\s+-f|-f\s+-r)\b", "rm -rf (recursive force delete)"),
    (r"\brm\s+-rf?\s+(/|~|\$home|\.)(\s|$)", "rm of a root / home / repo-root path"),
    (r"\bgit\s+clean\s+-[a-z]*f[a-z]*d|\bgit\s+clean\s+-[a-z]*d[a-z]*f", "git clean -fd (wipes untracked files incl. tfstate/tfvars)"),
    # ── Git history / remote damage ──
    (r"\bgit\s+push\b[^\n]*(--force\b|--force-with-lease|\s-f\b|\s\+)", "force-push (rewrites remote history)"),
    (r"\bgit\s+push\b[^\n]*\s:[\w./-]+", "deleting a remote branch via push"),
    (r"\bgit\s+reset\s+--hard\b", "git reset --hard (discards uncommitted work)"),
    # ── AWS: irreversible infra / identity / key / security deletion ──
    (r"\baws\s+\S+\s+delete-", "aws ... delete-* (resource deletion)"),
    (r"\baws\s+iam\s+(delete|remove|detach)", "aws iam delete/remove/detach"),
    (r"\baws\s+kms\s+(schedule-key-deletion|disable-key)", "KMS key deletion/disable (can make encrypted data unrecoverable)"),
    (r"\baws\s+s3\s+rb\b", "aws s3 rb (delete bucket)"),
    (r"\baws\s+s3(api)?\s+[^\n]*--recursive[^\n]*\brm\b|\baws\s+s3\s+rm\b[^\n]*--recursive", "recursive S3 object deletion"),
    (r"\baws\s+(dynamodb\s+delete-table|cloudtrail\s+(delete|stop)-|guardduty\s+delete|lightsail\s+delete)", "deleting/disabling a stateful or security AWS resource"),
    (r"\baws\s+(ce\s+delete-anomaly|budgets\s+delete)", "deleting cost / anomaly guardrails"),
    # ── Credential / secret exfiltration ──
    (r"(curl|wget|nc|ncat)\b[^\n]*(--data\b|--data-binary\b|--upload-file\b|\s-d\b|\s-T\b)", "uploading local data over the network (possible exfiltration)"),
    (r"(cat|aws\s+ssm\s+get-parameter|aws\s+secretsmanager)[^\n]*\|\s*(curl|wget|nc|ncat|bash|sh)", "piping secrets into a shell or network call"),
    (r"(curl|wget)\b[^|\n]*\|\s*(sudo\s+)?(bash|sh|zsh|python3?)\b", "pipe-to-shell (curl|wget ... | sh) runs unreviewed remote code"),
    # ── Guardrail evasion ──
    (r"--dangerously-skip-permissions|--yolo\b", "attempting to bypass the permission system"),
    (r"(rm|mv|chmod\s+-x|git\s+rm)\b[^\n]*\.claude/(settings\.json|hooks)", "removing/disabling the guardrail config or hook"),
    (r"\bchmod\s+777\b", "chmod 777 (world-writable)"),
    # ── Classic footguns ──
    (r"\bdd\s+if=[^\n]*of=/dev/", "dd to a raw device"),
    (r"\bmkfs\b", "mkfs (format filesystem)"),
    (r":\(\)\s*\{\s*:\|:&\s*\};:", "fork bomb"),
    (r">\s*/dev/sd[a-z]", "writing to a raw disk device"),
]

for pat, label in RULES:
    if re.search(pat, c, re.IGNORECASE):
        block(label + "  [command: %s]" % cmd.strip()[:200])

sys.exit(0)
