import pytest
from unittest.mock import patch, MagicMock
from apps.api import supabase_client

def test_create_result():
    mock_table = MagicMock()
    mock_table.insert.return_value.execute.return_value = {'data': {'id': 'result-1'}}
    with patch.object(supabase_client.supabase, 'table', return_value=mock_table):
        result = supabase_client.create_result('org-1', 'scan-1', 'user-1', 'finding', 'high', 'NIST', {'details': 1})
        assert result['data']['id'] == 'result-1'

def test_get_results_for_scan():
    mock_table = MagicMock()
    mock_table.select.return_value.eq.return_value.eq.return_value.execute.return_value = {'data': [{'id': 'result-1'}]}
    with patch.object(supabase_client.supabase, 'table', return_value=mock_table):
        result = supabase_client.get_results_for_scan('org-1', 'scan-1')
        assert result['data'][0]['id'] == 'result-1' 