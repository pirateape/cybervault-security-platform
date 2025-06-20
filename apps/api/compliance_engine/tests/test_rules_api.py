import pytest
from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api.compliance_engine import rules_api

client = TestClient(app)

# Shared in-memory store for all tests
store = {}

@pytest.fixture(autouse=True, scope="function")
def override_dependencies():
    class DummyTable:
        def __init__(self):
            self._action = None
            self._filters = []
            self._result = []
        def select(self, *a, **k):
            self._action = "select"
            print("SELECT CALLED. Filters:", self._filters)
            return self
        def insert(self, data):
            self._action = "insert"
            rule = data.copy() if isinstance(data, dict) else data[0].copy()
            rid = rule["id"]
            print("STORE BEFORE INSERT:", store)
            if rid in store:
                self._result = []
            else:
                store[rid] = rule
                self._result = [rule]
            print("STORE AFTER INSERT:", store)
            print("INSERT RESULT:", self._result)
            return self
        def update(self, data):
            self._action = "update"
            rule = data.copy() if isinstance(data, dict) else data[0].copy()
            rid = rule.get("id")
            if rid and rid in store:
                store[rid].update(rule)
                self._result = [store[rid]]
            else:
                self._result = []
            return self
        def delete(self):
            self._action = "delete"
            for rid in list(store.keys()):
                if all(f[1] == store[rid].get(f[0]) for f in self._filters):
                    del store[rid]
            self._result = []
            return self
        def eq(self, key, value):
            self._filters.append((key, value))
            print(f"EQ CALLED: {key} == {value}")
            return self
        def single(self):
            self._single = True
            return self
        def execute(self):
            if self._action == "select":
                if self._filters:
                    for k, v in self._filters:
                        print(f"FILTER: {k} == {v} (type: {type(v)})")
                    for r in store.values():
                        print(f"STORE VALUE: id={r.get('id')} (type: {type(r.get('id'))}), org_id={r.get('org_id')} (type: {type(r.get('org_id'))})")
                    filtered = [r for r in store.values() if all(r.get(k) == v for k, v in self._filters)]
                    print("FILTERED RESULT:", filtered)
                else:
                    filtered = list(store.values())
                if getattr(self, "_single", False):
                    return type('obj', (object,), {"error": None, "data": filtered[0] if filtered else None})()
                return type('obj', (object,), {"error": None, "data": filtered})()
            elif self._action in ("insert", "update"):
                return type('obj', (object,), {"error": None, "data": self._result})()
            elif self._action == "delete":
                return type('obj', (object,), {"error": None, "data": []})()
            return type('obj', (object,), {"error": None, "data": []})()
    class DummySupabase:
        def table(self, name):
            return DummyTable()
    app.dependency_overrides[rules_api.rbac_check] = lambda: {"role": "admin"}
    app.dependency_overrides[rules_api.get_supabase_client] = lambda: (print("MOCK get_supabase_client CALLED"), DummySupabase())[1]
    yield
    app.dependency_overrides = {}

@pytest.fixture
def org_id():
    return "test-org-uuid"

@pytest.fixture
def rule_payload():
    return {
        "id": "1",
        "name": "Test Rule",
        "description": "desc",
        "framework": "NIST",
        "severity": "high",
        "conditions": {"all": [{"fact": "user.mfa_enabled", "operator": "equal", "value": True}]},
        "event": {"type": "non_compliance", "params": {"message": "fail"}},
        "is_active": True
    }

def test_create_rule(org_id, rule_payload):
    store.clear()
    print("STORE BEFORE POST:", store)
    response = client.post(f"/rules/?org_id={org_id}", json=rule_payload)
    print("STORE AFTER POST:", store)
    if response.status_code != 201:
        print("CREATE ERROR:", response.json())
    assert response.status_code == 201
    assert response.json()["id"] == rule_payload["id"]

def test_list_rules(org_id, rule_payload):
    store.clear()
    rule = rule_payload.copy()
    rule["org_id"] = org_id
    store[rule["id"]] = rule
    response = client.get(f"/rules/?org_id={org_id}")
    assert response.status_code == 200
    assert response.json()[0]["id"] == rule_payload["id"]

def test_get_rule(org_id, rule_payload):
    store.clear()
    rule = rule_payload.copy()
    rule["org_id"] = org_id
    store[rule["id"]] = rule
    response = client.get(f"/rules/1?org_id={org_id}")
    assert response.status_code == 200
    assert response.json()["id"] == rule_payload["id"]

def test_update_rule(org_id, rule_payload):
    store.clear()
    rule = rule_payload.copy()
    rule["org_id"] = org_id
    store[rule["id"]] = rule
    updated = rule_payload.copy()
    updated["name"] = "Updated Rule"
    updated["org_id"] = org_id
    response = client.put(f"/rules/1?org_id={org_id}", json=updated)
    if response.status_code != 200:
        print("UPDATE ERROR:", response.json())
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Rule"

def test_delete_rule(org_id, rule_payload):
    store.clear()
    rule = rule_payload.copy()
    rule["org_id"] = org_id
    store[rule["id"]] = rule
    response = client.delete(f"/rules/1?org_id={org_id}")
    assert response.status_code == 204 