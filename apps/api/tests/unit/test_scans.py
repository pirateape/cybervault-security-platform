import pytest
from unittest.mock import patch, MagicMock
from apps.api import supabase_client

def test_create_scan():
    mock_table = MagicMock()
    mock_table.insert.return_value.execute.return_value = {'data': {'id': 'scan-1'}}
    with patch.object(supabase_client.supabase, 'table', return_value=mock_table):
        result = supabase_client.create_scan('org-1', 'user-1', 'type', 'pending', 'target', {'meta': 1})
        assert result['data']['id'] == 'scan-1'

def test_get_scan():
    mock_table = MagicMock()
    mock_table.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = {'data': {'id': 'scan-1'}}
    with patch.object(supabase_client.supabase, 'table', return_value=mock_table):
        result = supabase_client.get_scan('org-1', 'scan-1')
        assert result['data']['id'] == 'scan-1' 