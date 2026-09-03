#!/usr/bin/env python3
"""Fail-closed governance for D1/SQL migration numbering across open PRs.

Historical duplicate prefixes already present on main are grandfathered. New SQL
migrations are append-only, strictly monotonic against the PR base, and may not
reserve a prefix concurrently with another open PR.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import urllib.request

REPOSITORY = os.environ["REPOSITORY"]
GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
BASE_SHA = os.environ.get("BASE_SHA", "").strip()
HEAD_SHA = os.environ.get("HEAD_SHA", "").strip()
MIGRATION_PATTERN = re.compile(r"^db/migrations/(\d{4})_[^/]+\.sql$")
ERRORS: list[str] = []


def git(*args: str) -> list[str]:
    return subprocess.check_output(["git", *args], text=True).splitlines()


def ensure_commit(sha: str) -> None:
    if not sha:
        return
    try:
        subprocess.check_call(
            ["git", "cat-file", "-e", f"{sha}^{{commit}}"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError:
        subprocess.check_call(["git", "fetch", "--no-tags", "origin", sha])


def validate_current_pr() -> None:
    if not BASE_SHA or not HEAD_SHA:
        return

    ensure_commit(BASE_SHA)
    ensure_commit(HEAD_SHA)
    changes = git("diff", "--name-status", BASE_SHA, HEAD_SHA, "--", "db/migrations")
    added: list[tuple[str, str]] = []

    for line in changes:
        parts = line.split("\t")
        status = parts[0]
        paths = parts[1:]

        if status == "A" and len(paths) == 1:
            path = paths[0]
            if not path.endswith(".sql"):
                continue
            match = MIGRATION_PATTERN.match(path)
            if not match:
                ERRORS.append(f"{path}: nova migration deve seguir NNNN_nome.sql")
                continue
            added.append((path, match.group(1)))
            continue

        if any(path.endswith(".sql") for path in paths):
            ERRORS.append(
                f"{' -> '.join(paths)}: migrations existentes são imutáveis (status {status})"
            )

    base_paths = git("ls-tree", "-r", "--name-only", BASE_SHA, "--", "db/migrations")
    base_prefixes: dict[str, list[str]] = {}
    for path in base_paths:
        match = MIGRATION_PATTERN.match(path)
        if match:
            base_prefixes.setdefault(match.group(1), []).append(path)

    max_base = max((int(prefix) for prefix in base_prefixes), default=0)
    seen_in_pr: dict[str, str] = {}
    for path, prefix in added:
        if prefix in base_prefixes:
            ERRORS.append(
                f"{path}: prefixo {prefix} já existe na base: "
                + ", ".join(base_prefixes[prefix])
            )
        if int(prefix) <= max_base:
            ERRORS.append(
                f"{path}: prefixo {prefix} deve ser maior que o maior prefixo da base ({max_base:04d})"
            )
        if prefix in seen_in_pr:
            ERRORS.append(
                f"{path}: prefixo {prefix} duplicado no mesmo PR ({seen_in_pr[prefix]})"
            )
        else:
            seen_in_pr[prefix] = path


def api(path: str):
    request = urllib.request.Request(
        "https://api.github.com" + path,
        headers={
            "Authorization": f"Bearer {GITHUB_TOKEN}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "neuroped-migration-governance",
        },
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)


def list_open_pulls() -> list[dict]:
    pulls: list[dict] = []
    page = 1
    while True:
        batch = api(f"/repos/{REPOSITORY}/pulls?state=open&per_page=100&page={page}")
        pulls.extend(batch)
        if len(batch) < 100:
            return pulls
        page += 1


def list_pull_files(number: int) -> list[dict]:
    files: list[dict] = []
    page = 1
    while True:
        batch = api(
            f"/repos/{REPOSITORY}/pulls/{number}/files?per_page=100&page={page}"
        )
        files.extend(batch)
        if len(batch) < 100:
            return files
        page += 1


def validate_open_pr_collisions() -> None:
    ownership: dict[str, list[tuple[int, str]]] = {}
    for pull in list_open_pulls():
        number = int(pull["number"])
        for item in list_pull_files(number):
            if item.get("status") != "added":
                continue
            path = item["filename"]
            match = MIGRATION_PATTERN.match(path)
            if match:
                ownership.setdefault(match.group(1), []).append((number, path))

    for prefix, entries in ownership.items():
        pull_numbers = sorted({number for number, _ in entries})
        if len(pull_numbers) > 1:
            detail = ", ".join(f"#{number} ({path})" for number, path in entries)
            ERRORS.append(f"prefixo {prefix} concorre entre PRs abertos: {detail}")


def main() -> int:
    validate_current_pr()
    try:
        validate_open_pr_collisions()
    except Exception as exc:  # fail closed: governance cannot become advisory on API failure
        ERRORS.append(f"não foi possível auditar PRs abertos via GitHub API: {exc}")

    if ERRORS:
        for error in ERRORS:
            print(f"::error::{error}")
        print(f"\nMigration governance: {len(ERRORS)} problema(s).")
        return 1

    print(
        "Migration governance: OK — migrations novas são monotônicas/imutáveis "
        "e não há colisão de prefixos entre PRs abertos."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
