# edu-lab

Static educational worksheet generator (vanilla JS SPA) deployed to S3 + CloudFront via
GitHub Actions OIDC. The deploy/runbook is in **[../DEPLOY.md](../DEPLOY.md)**.

<!-- Claude Code auto-loads this file and expands @-imports at launch. AGENTS.md
     (repo root) is the tool-agnostic source of truth — Cursor/Codex/Cowork read it
     directly; this import makes Claude Code load it too. Keep AGENTS.md updated. -->
@../AGENTS.md

## 🛡️ AI agent guardrails (do no harm)

These rules apply to **any** AI agent (Claude Code, Cursor, Copilot, etc.) and to humans
acting on their suggestions. They are enforced in two layers — the deny rules in
`.claude/settings.json` and the `PreToolUse` hook at `.claude/hooks/guardrail.py` — but the
contract is here in writing so the intent is unambiguous.

**Prime directive: do no harm. Prefer the reversible action. When unsure, stop and ask a
human — never guess on anything destructive or irreversible.**

### Never (these are hard-blocked; do not attempt to route around them)

- **Never destroy or hand-edit infrastructure state.** No `terraform destroy` /
  `apply -destroy`, no `terraform state rm`/`mv`, no `force-unlock`, no editing or deleting
  `*.tfstate`. State is the source of truth for what exists in the cloud; corrupting it can
  orphan or duplicate live resources.
- **Never run destructive cloud deletions** — `aws … delete-*`, `aws s3 rb`,
  `aws s3 rm --recursive`, `kms schedule-key-deletion`/`disable-key`, deleting/stopping
  CloudTrail, GuardDuty, DynamoDB tables, Lightsail instances, or budget/anomaly monitors.
  Scheduling a KMS key for deletion can make encrypted data (including remote state)
  permanently unrecoverable.
- **Never rewrite or erase history/work** — no `git push --force`, no `git reset --hard`,
  no `git clean -fd`, no `git branch -D`, no `rm -rf`.
- **Never exfiltrate secrets** — do not read `*.tfstate`, `.env`, or `.pem` files and do
  not pipe their contents (or `aws ssm get-parameter --with-decryption` output) into the
  network or a shell. No `curl … | sh` pipe-to-shell. (Reading/writing `*.tfvars` is
  allowed — secrets live in SSM, not tfvars; the `Read(./**/*.tfvars)` deny in
  `.claude/settings.json` must be removed by a human to take effect.)
- **Never weaken the guardrails to complete a task.** Do not edit `.claude/settings.json`
  or `.claude/hooks/`, do not pass `--dangerously-skip-permissions`/`--yolo`, and do not
  re-shell a blocked command to evade detection. If a guardrail blocks something genuinely
  necessary, surface it to a human and let *them* decide — the guardrail is the answer, not
  the obstacle.

### Always

- **Plan and propose, then let a human apply anything that changes live infrastructure.** Generate
  the command, run `terraform plan` / `fmt` / `validate`, explain the blast radius, and wait
  for explicit human approval before `apply`. Remote state lives in the shared S3 backend
  (KMS-encrypted, `use_lockfile`); rely on it rather than local state.
- **Make changes small, reviewable, and reversible.** One concern per change; keep a diff a
  human can read.
- **Treat `main` as protected.** Work on branches and open PRs; never force anything onto a
  shared branch.

If a needed action is destructive or blocked, the correct move is always: **stop, explain
why, and hand it to a human** — not to find a workaround.
