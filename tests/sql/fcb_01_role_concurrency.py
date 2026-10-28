"""Native PostgreSQL regression; run after fcb_01_rpc_security.test.sql.

Uses only psql and the Python standard library. Refuses non-local hosts and
checks the exact disposable fixture shape before changing synthetic roles.
"""

from __future__ import annotations

import os
import re
import select
import shutil
import subprocess
import sys
import time
from threading import Event


ADMIN_A = "00000000-0000-4000-8000-000000000001"
ADMIN_B = "00000000-0000-4000-8000-000000000004"
FIXTURE_IDS = tuple(f"00000000-0000-4000-8000-{n:012}" for n in range(1, 5))
TIMEOUT = 20.0


def connection() -> tuple[list[str], dict[str, str]]:
    for key, required in (("PGHOST", "127.0.0.1"), ("PGDATABASE", "postgres"), ("PGUSER", "postgres")):
        if os.environ.get(key, required) != required:
            raise RuntimeError(f"Refusing {key}: this test requires {required}")
    port = os.environ.get("PGPORT", "5432")
    if not port.isdigit() or not 1 <= int(port) <= 65535:
        raise RuntimeError("Invalid disposable PostgreSQL port")
    psql = shutil.which("psql")
    if psql is None:
        raise RuntimeError("Native psql is required; concurrency was not tested")
    # Explicit CLI destinations and a clean PG environment prevent PGHOSTADDR,
    # PGSERVICE or PGOPTIONS from redirecting the disposable connection.
    env = {key: value for key, value in os.environ.items() if not key.startswith("PG")}
    if "PGPASSWORD" in os.environ:
        env["PGPASSWORD"] = os.environ["PGPASSWORD"]
    env["PGCONNECT_TIMEOUT"] = "5"
    args = [psql, "-X", "-qAt", "--no-password", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=verbose",
            "--host=127.0.0.1", f"--port={port}", "--dbname=postgres", "--username=postgres"]
    return args, env


def query(args: list[str], env: dict[str, str], sql: str) -> str:
    result = subprocess.run(args + ["-c", sql], env=env, capture_output=True, text=True, timeout=10)
    if result.returncode != 0:
        raise RuntimeError(f"Disposable database query failed: {result.stderr.strip()}")
    return result.stdout.strip()


class Session:
    def __init__(self, args: list[str], env: dict[str, str], name: str):
        self.process = subprocess.Popen(args, env=env, stdin=subprocess.PIPE,
                                        stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        self.output = ""
        self.eof = False
        self.send(f"set application_name='fcb01_{name}';\nselect 'backend_pid:'||pg_backend_pid();\n\\echo CONNECTED_{name}\n")
        self.until(f"CONNECTED_{name}")
        match = re.search(r"backend_pid:(\d+)", self.output)
        if match is None:
            raise RuntimeError("Missing disposable session backend PID")
        self.backend_pid = int(match.group(1))

    def send(self, sql: str) -> None:
        assert self.process.stdin is not None
        self.process.stdin.write(sql.encode())
        self.process.stdin.flush()

    def pump(self, deadline: float) -> None:
        assert self.process.stdout is not None
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError("Timed out waiting for PostgreSQL session progress")
        ready, _, _ = select.select([self.process.stdout], [], [], remaining)
        if not ready:
            raise TimeoutError("Timed out waiting for PostgreSQL session output")
        chunk = os.read(self.process.stdout.fileno(), 65536)
        if chunk:
            self.output += chunk.decode("utf-8", errors="replace")
        else:
            self.eof = True

    def until(self, marker: str) -> None:
        deadline = time.monotonic() + TIMEOUT
        while marker not in self.output:
            if self.eof:
                raise RuntimeError(f"Session ended before {marker}: {self.output.strip()}")
            self.pump(deadline)

    def finish(self) -> int:
        if self.process.stdin is not None:
            self.process.stdin.close()
            self.process.stdin = None
        deadline = time.monotonic() + TIMEOUT
        while not self.eof:
            self.pump(deadline)
        return self.process.wait(timeout=max(0.1, deadline - time.monotonic()))

    def close(self) -> None:
        if self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait(timeout=5)
        for pipe in (self.process.stdin, self.process.stdout):
            if pipe is not None:
                pipe.close()


def assert_fixture(args: list[str], env: dict[str, str]) -> None:
    ids = ",".join(f"'{value}'::uuid" for value in FIXTURE_IDS)
    # Production auth.users has many additional columns. This rejects even an
    # accidentally forwarded live database before any mutation is attempted.
    shape = query(args, env, f"""
      select case when
        (select array_agg(column_name::text order by ordinal_position)
           from information_schema.columns where table_schema='auth' and table_name='users') = array['id']::text[]
        and (select array_agg(column_name::text order by ordinal_position)
           from information_schema.columns where table_schema='ace' and table_name='roles') = array['user_id','role']::text[]
        and (select count(*) from auth.users)=4
        and (select count(*) from auth.users where id in ({ids}))=4
        and (select count(*) from ace.roles)=4
        and (select count(*) from ace.roles where user_id in ({ids}))=4
      then 'disposable-fixture' else 'refused' end;
    """)
    if shape != "disposable-fixture":
        raise RuntimeError("Refusing database: expected exact FCB-01 disposable fixture")


def run_case(args: list[str], env: dict[str, str], isolation: str) -> None:
    query(args, env, f"""
      update ace.roles set role=case when user_id in ('{ADMIN_A}','{ADMIN_B}') then 'admin' else 'student' end;
    """)
    sessions: list[Session] = []
    try:
        a = Session(args, env, "a")
        sessions.append(a)
        b = Session(args, env, "b")
        sessions.append(b)
        for session, user_id, label in ((a, ADMIN_A, "A"), (b, ADMIN_B, "B")):
            session.send(f"""begin isolation level {isolation};
set local statement_timeout='15s';
set local role authenticated;
select set_config('request.jwt.claim.sub','{user_id}',true);
select 'snapshot_admin:'||ace.is_admin();
\\echo SNAPSHOT_{label}
""")
            session.until(f"SNAPSHOT_{label}")
            if "snapshot_admin:true" not in session.output:
                raise RuntimeError(f"Session {label} did not establish an administrator snapshot")

        a.send("select ace.set_user_role(auth.uid(),'student');\n\\echo A_DEMOTED\n")
        a.until("A_DEMOTED")
        # B must attempt its mutation while A's transaction still owns the lock.
        b.send("select ace.set_user_role(auth.uid(),'student');\ncommit;\n\\echo B_UNSAFE_COMMIT\n")
        deadline = time.monotonic() + 10
        poll = Event()
        while True:
            blocked = query(args, env, f"select {a.backend_pid}=any(pg_blocking_pids({b.backend_pid}));")
            if blocked == "t":
                break
            if b.process.poll() is not None:
                raise RuntimeError("Competing session ended before the lock-wait condition was observed")
            if time.monotonic() >= deadline:
                raise TimeoutError("B never waited for A's role mutation lock")
            poll.wait(min(0.05, max(0, deadline - time.monotonic())))

        a.send("commit;\n\\echo A_COMMITTED\n")
        a.until("A_COMMITTED")
        if a.finish() != 0:
            raise RuntimeError(f"First administrator demotion failed: {a.output.strip()}")
        second_status = b.finish()
        allowed_states = {"42501", "23514"} if isolation == "READ COMMITTED" else {"40001", "42501", "23514"}
        observed = set(re.findall(r"ERROR:\s+([0-9A-Z]{5}):", b.output))
        if second_status == 0 or "B_UNSAFE_COMMIT" in b.output or not observed.intersection(allowed_states):
            raise RuntimeError(f"Competing demotion did not fail safely ({isolation}): {b.output.strip()}")
        remaining = query(args, env, "select count(*) from ace.roles where role='admin';")
        if remaining != "1":
            raise RuntimeError(f"Expected exactly one administrator after {isolation}; got {remaining}")
        print(f"PASS {isolation}: competing demotion rejected ({','.join(sorted(observed))}); one administrator remains")
    finally:
        for session in sessions:
            session.close()


def main() -> None:
    args, env = connection()
    assert_fixture(args, env)
    for isolation in ("READ COMMITTED", "REPEATABLE READ"):
        run_case(args, env, isolation)


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, TimeoutError, OSError, subprocess.SubprocessError) as error:
        print(f"FAIL FCB-01 role concurrency: {error}", file=sys.stderr)
        sys.exit(1)
