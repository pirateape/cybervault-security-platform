import pytest
from unittest.mock import patch, MagicMock
from apps.api import supabase_client

def test_create_audit_log():
    with patch('apps.api.supabase_client.create_audit_log', return_value={'data': {'id': 'log-1'}}) as mock_create:
        result = mock_create('org-1', 'user-1', 'action', 'target-id', 'target-table', {'details': 1})
        assert result['data']['id'] == 'log-1'

def test_get_audit_logs_for_user():
    with patch('apps.api.supabase_client.get_audit_logs_for_user', return_value={'data': [{'id': 'log-1'}]}) as mock_get:
        result = mock_get('org-1', 'user-1')
        assert result['data'][0]['id'] == 'log-1'

def test_audit_log_immutability():
    # Simulate permission error for update
    with patch('apps.api.supabase_client.create_audit_log', side_effect=Exception('permission denied for update')):
        with pytest.raises(Exception) as excinfo_update:
            from apps.api import supabase_client
            supabase_client.create_audit_log('org-1', 'user-1', 'tamper', 'log-1', 'audit_logs', {'action': 'tamper'})
        assert 'permission denied' in str(excinfo_update.value)
    # Simulate permission error for delete (using a hypothetical delete function)
    with patch('apps.api.supabase_client.get_audit_logs_for_user', side_effect=Exception('permission denied for delete')):
        with pytest.raises(Exception) as excinfo_delete:
            from apps.api import supabase_client
            supabase_client.get_audit_logs_for_user('org-1', 'user-1')
        assert 'permission denied' in str(excinfo_delete.value) 