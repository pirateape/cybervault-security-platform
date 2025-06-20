import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from apps.api.compliance_engine.result_storage import store_scan_result
from apps.api.compliance_engine.remediation import RemediationAction
import asyncio
import uuid
from datetime import datetime

@pytest.mark.asyncio
async def test_store_scan_result_success():
    with patch('apps.api.supabase_client.create_result', return_value={'data': [{'id': 'result-1'}]}) as mock_create_result:
        result = await store_scan_result('org-1', 'scan-1', 'user-1', 'finding', 'high', 'NIST', {'details': 1}, passed=True)
        assert result['data'][0]['id'] == 'result-1'
        mock_create_result.assert_called_once()

@pytest.mark.asyncio
async def test_store_scan_result_auto_remediation():
    valid_uuid = str(uuid.uuid4())
    with patch('requests.post') as mock_post, \
         patch('apps.api.compliance_engine.remediation.create_remediation_action', new_callable=AsyncMock) as mock_create_remediation, \
         patch('apps.api.supabase_client.create_result', return_value=[{'id': valid_uuid}]):
        mock_post.return_value.json.return_value = [{'id': valid_uuid}]
        mock_create_remediation.return_value = RemediationAction(id=valid_uuid, result_id=valid_uuid, status='open', assigned_to=None, verified=False, metadata={}, created_at=datetime.utcnow(), updated_at=datetime.utcnow())
        result = await store_scan_result('org-1', 'scan-1', 'user-1', 'finding', 'high', 'NIST', {'details': 1}, passed=False)
        assert result[0]['id'] == valid_uuid

@pytest.mark.asyncio
async def test_store_scan_result_error():
    with patch('apps.api.supabase_client.create_result', side_effect=Exception('fail')):
        with pytest.raises(Exception) as exc:
            await store_scan_result('org-1', 'scan-1', 'user-1', 'finding', 'high', 'NIST', {'details': 1}, passed=True)
        assert 'fail' in str(exc.value) 