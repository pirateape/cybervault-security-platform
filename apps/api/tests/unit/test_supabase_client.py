import pytest
from unittest.mock import patch, MagicMock
from apps.api import supabase_client

def test_create_user():
    mock_table = MagicMock()
    mock_table.insert.return_value.execute.return_value = {'data': {'id': 'user-1'}}
    with patch.object(supabase_client.supabase, 'table', return_value=mock_table):
        result = supabase_client.create_user('org-1', 'test@example.com', 'hashed', 'Test User', 'admin')
        assert result['data']['id'] == 'user-1'

def test_get_user_by_email():
    mock_table = MagicMock()
    mock_table.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = {'data': {'email': 'test@example.com'}}
    with patch.object(supabase_client.supabase, 'table', return_value=mock_table):
        result = supabase_client.get_user_by_email('org-1', 'test@example.com')
        assert result['data']['email'] == 'test@example.com'

def test_disable_user():
    mock_table = MagicMock()
    mock_table.update.return_value.eq.return_value.eq.return_value.execute.return_value = {'data': {'id': 'user-1', 'is_disabled': True}}
    with patch.object(supabase_client.supabase, 'table', return_value=mock_table):
        result = supabase_client.disable_user('org-1', 'user-1')
        assert result['data']['is_disabled'] is True

def test_disable_user_error():
    mock_table = MagicMock()
    mock_table.update.return_value.eq.return_value.eq.return_value.execute.return_value = {'error': {'message': 'fail'}}
    with patch.object(supabase_client.supabase, 'table', return_value=mock_table):
        result = supabase_client.disable_user('org-1', 'user-1')
        assert 'error' in result

def test_enable_user():
    mock_table = MagicMock()
    mock_table.update.return_value.eq.return_value.eq.return_value.execute.return_value = {'data': {'id': 'user-1', 'is_disabled': False}}
    with patch.object(supabase_client.supabase, 'table', return_value=mock_table):
        result = supabase_client.enable_user('org-1', 'user-1')
        assert result['data']['is_disabled'] is False

def test_enable_user_error():
    mock_table = MagicMock()
    mock_table.update.return_value.eq.return_value.eq.return_value.execute.return_value = {'error': {'message': 'fail'}}
    with patch.object(supabase_client.supabase, 'table', return_value=mock_table):
        result = supabase_client.enable_user('org-1', 'user-1')
        assert 'error' in result

def test_delete_user():
    mock_table = MagicMock()
    mock_table.delete.return_value.eq.return_value.eq.return_value.execute.return_value = {'data': {'id': 'user-1'}}
    with patch.object(supabase_client.supabase, 'table', return_value=mock_table):
        result = supabase_client.delete_user('org-1', 'user-1')
        assert result['data']['id'] == 'user-1'

def test_delete_user_error():
    mock_table = MagicMock()
    mock_table.delete.return_value.eq.return_value.eq.return_value.execute.return_value = {'error': {'message': 'fail'}}
    with patch.object(supabase_client.supabase, 'table', return_value=mock_table):
        result = supabase_client.delete_user('org-1', 'user-1')
        assert 'error' in result

def test_create_user_db_exception():
    mock_table = MagicMock()
    mock_table.insert.return_value.execute.side_effect = Exception('DB error')
    with patch.object(supabase_client.supabase, 'table', return_value=mock_table):
        try:
            supabase_client.create_user('org-1', 'test@example.com', 'hashed', 'Test User', 'admin')
            assert False, 'Should raise Exception'
        except Exception as e:
            assert 'DB error' in str(e)

def test_get_user_by_email_empty():
    mock_table = MagicMock()
    mock_table.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = {'data': None}
    with patch.object(supabase_client.supabase, 'table', return_value=mock_table):
        result = supabase_client.get_user_by_email('org-1', 'test@example.com')
        assert result['data'] is None

def test_disable_user_invalid_input():
    mock_table = MagicMock()
    mock_table.update.return_value.eq.return_value.eq.return_value.execute.return_value = {'error': {'message': 'Invalid user_id'}}
    with patch.object(supabase_client.supabase, 'table', return_value=mock_table):
        result = supabase_client.disable_user('org-1', None)
        assert 'error' in result

def test_enable_user_db_exception():
    mock_table = MagicMock()
    mock_table.update.return_value.eq.return_value.eq.return_value.execute.side_effect = Exception('DB error')
    with patch.object(supabase_client.supabase, 'table', return_value=mock_table):
        try:
            supabase_client.enable_user('org-1', 'user-1')
            assert False, 'Should raise Exception'
        except Exception as e:
            assert 'DB error' in str(e)

def test_delete_user_empty_result():
    mock_table = MagicMock()
    mock_table.delete.return_value.eq.return_value.eq.return_value.execute.return_value = {'data': None}
    with patch.object(supabase_client.supabase, 'table', return_value=mock_table):
        result = supabase_client.delete_user('org-1', 'user-1')
        assert result['data'] is None 