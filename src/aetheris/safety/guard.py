from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from ..memory.store import MemoryStore
from ..tools.base import Tool


FILESYSTEM_TOOLS = {"read_file", "list_dir", "write_file", "edit_file", "search_content"}
SHELL_TOOLS = {"shell", "run_tests", "run_check"}

#: Characters that let a single "allowlisted" command chain, redirect,
#: substitute, or expand into something else under cmd.exe, PowerShell,
#: or POSIX shells.  Commands containing any of them are refused outright.
SHELL_METACHARACTERS = frozenset("&|;<>`$%^(){}\n\r")


@dataclass(frozen=True)
class ActionRequest:
    """A request to run a tool. Everything the safety layer needs to decide."""

    tool: str
    arg: str
    safe: bool = True
    dry_run: bool = False


@dataclass(frozen=True)
class Decision:
    """The verdict for a single action."""

    allowed: bool
    reason: str


@dataclass(frozen=True)
class ActionResult:
    """Outcome of routing an action through the safety layer."""

    executed: bool
    allowed: bool
    reason: str
    output: str | None = None
    preview: str | None = None


# A rule inspects (request, safe_mode) and returns a blocking Decision,
# or None to abstain. Deny wins: the first blocking decision stops execution.
Rule = Callable[[ActionRequest, bool], "Decision | None"]


def _safe_mode_rule(request: ActionRequest, safe_mode: bool) -> Decision | None:
    """With safe_mode on, any tool not explicitly marked safe is blocked."""
    if safe_mode and not request.safe:
        return Decision(
            allowed=False,
            reason=f"safe_mode is on and tool '{request.tool}' is not marked safe",
        )
    return None


def _within_root(target: Path, root: Path) -> Decision | None:
    if target != root and root not in target.parents:
        return Decision(
            allowed=False,
            reason=f"path '{target}' escapes workspace root '{root}'",
        )
    return None


def path_within_root(workspace_root: str) -> Rule:
    """Block filesystem tools whose target path escapes the workspace root."""
    root = Path(workspace_root).resolve()

    def rule(request: ActionRequest, safe_mode: bool) -> Decision | None:
        if request.tool not in FILESYSTEM_TOOLS:
            return None
        try:
            data = json.loads(request.arg)
            raw = data.get("path", ".") if request.tool == "search_content" else data["path"]
            target = Path(raw).resolve()
        except (ValueError, KeyError, TypeError, AttributeError):
            return Decision(allowed=False, reason="invalid argument: expected JSON with 'path'")
        return _within_root(target, root)

    return rule


def shell_allowlist(allowed: tuple[str, ...], workspace_root: str = ".") -> Rule:
    """Gate shell/test/lint commands.

    A command is allowed only if it (1) contains no shell metacharacters,
    (2) starts with an allowlisted executable, and (3) runs with a working
    directory inside the workspace root.  Checking only the first token is
    not enough: ``echo hi & del ...`` starts with ``echo``.
    """
    root = Path(workspace_root).resolve()

    def rule(request: ActionRequest, safe_mode: bool) -> Decision | None:
        if request.tool not in SHELL_TOOLS:
            return None
        try:
            data = json.loads(request.arg)
            cmd = data["cmd"]
            if not isinstance(cmd, str):
                raise TypeError("cmd must be a string")
        except (ValueError, KeyError, TypeError):
            return Decision(allowed=False, reason="invalid argument: expected JSON with 'cmd'")
        bad = sorted({c for c in cmd if c in SHELL_METACHARACTERS})
        if bad:
            return Decision(
                allowed=False,
                reason=f"command contains forbidden shell metacharacters: {bad!r}",
            )
        head = (cmd.split() or [""])[0]
        if head not in allowed:
            return Decision(allowed=False, reason=f"command '{head}' not in shell allowlist")
        cwd = data.get("cwd")
        if cwd is not None:
            try:
                return _within_root(Path(cwd).resolve(), root)
            except (TypeError, ValueError):
                return Decision(allowed=False, reason="invalid argument: 'cwd' must be a path")
        return None

    return rule


def build_default_rules(
    workspace_root: str = ".",
    allowed_shell_commands: tuple[str, ...] = ("echo", "ls", "pwd", "cat"),
) -> list[Rule]:
    """The full rule pipeline: safe_mode gate + path scoping + shell allowlist."""
    return [
        _safe_mode_rule,
        path_within_root(workspace_root),
        shell_allowlist(allowed_shell_commands, workspace_root),
    ]


def default_rules() -> list[Rule]:
    return [_safe_mode_rule]


class SafetyLayer:
    """The single guard every tool action routes through.

    - Evaluates ordered rules (deny wins).
    - Enforces the safe_mode gate.
    - Logs every attempt (allowed, blocked, or previewed) to memory.
    - Supports dry-run previews without executing.
    """

    def __init__(
        self,
        memory: MemoryStore,
        safe_mode: bool,
        rules: list[Rule] | None = None,
    ) -> None:
        self._memory = memory
        self._safe_mode = safe_mode
        self._rules = rules if rules is not None else default_rules()

    def evaluate(self, request: ActionRequest) -> Decision:
        for rule in self._rules:
            decision = rule(request, self._safe_mode)
            if decision is not None and not decision.allowed:
                return decision
        return Decision(allowed=True, reason="passed all safety rules")

    def run(self, tool: Tool, request: ActionRequest) -> ActionResult:
        decision = self.evaluate(request)

        if not decision.allowed:
            self._log("action_blocked", request, decision)
            return ActionResult(executed=False, allowed=False, reason=decision.reason)

        if request.dry_run:
            preview = f"[dry-run] would call {tool.name}({request.arg!r})"
            self._log("action_preview", request, decision, preview=preview)
            return ActionResult(
                executed=False, allowed=True, reason=decision.reason, preview=preview
            )

        output = tool.run(request.arg)
        self._log("action_allowed", request, decision, output=output)
        return ActionResult(
            executed=True, allowed=True, reason=decision.reason, output=output
        )

    def _log(
        self,
        kind: str,
        request: ActionRequest,
        decision: Decision,
        output: str | None = None,
        preview: str | None = None,
    ) -> None:
        self._memory.record(
            kind,
            {
                "tool": request.tool,
                "arg": request.arg,
                "safe": request.safe,
                "dry_run": request.dry_run,
                "safe_mode": self._safe_mode,
                "allowed": decision.allowed,
                "reason": decision.reason,
                "output": output,
                "preview": preview,
            },
        )
