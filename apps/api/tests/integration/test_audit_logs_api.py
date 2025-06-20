import pytest
from fastapi.testclient import TestClient
from apps.api.main import app
from unittest.mock import patch
from apps.api.main import log_audit_event

def test_audit_logs_append_only():
    import psycopg2
    import os
    # Only run if DB connection info is available
    dsn = os.getenv("TEST_DB_DSN")
    if not dsn:
        return
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    # Insert a row
    cur.execute("INSERT INTO audit_logs (id, org_id, user_id, action, details) VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'test', '{}'::jsonb)")
    conn.commit()
    # Try to update (should fail)
    try:
        cur.execute("UPDATE audit_logs SET action='tamper' LIMIT 1")
        conn.commit()
        assert False, "UPDATE should not be allowed on audit_logs"
    except Exception as e:
        assert 'append-only' in str(e) or 'not allowed' in str(e)
    # Try to delete (should fail)
    try:
        cur.execute("DELETE FROM audit_logs WHERE action='test'")
        conn.commit()
        assert False, "DELETE should not be allowed on audit_logs"
    except Exception as e:
        assert 'append-only' in str(e) or 'not allowed' in str(e)
    cur.close()
    conn.close()


def test_audit_log_file_shipping():
    import os, json
    # Remove file if exists
    if os.path.exists("audit_log_export.jsonl"):
        os.remove("audit_log_export.jsonl")
    log_audit_event("user", "action", {"foo": "bar"})
    assert os.path.exists("audit_log_export.jsonl")
    with open("audit_log_export.jsonl") as f:
        lines = f.readlines()
        assert any("user" in l and "action" in l for l in lines)

 