import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from apps.api.compliance_engine.remediation import (
    RemediationAction, create_remediation_action, get_remediation_action, update_remediation_action, list_remediation_actions,
    update_remediation_status, assign_remediation_action, verify_remediation_action, is_valid_status_transition
)
from uuid import uuid4
from datetime import datetime

def test_remediation_action_model():
    rid = uuid4()
    action = RemediationAction(
        id=uuid4(),
        result_id=rid,
        status='open',
        assigned_to=None,
        verified=False,
        metadata={'foo': 'bar'},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    assert action.status == 'open'
    assert action.verified is False
    assert action.metadata['foo'] == 'bar'

def test_valid_status_transitions():
    assert is_valid_status_transition('open', 'in_progress')
    assert is_valid_status_transition('open', 'resolved')
    assert is_valid_status_transition('in_progress', 'resolved')
    assert is_valid_status_transition('resolved', 'closed')
    assert not is_valid_status_transition('closed', 'open')
    assert not is_valid_status_transition('resolved', 'open')
    assert not is_valid_status_transition('open', 'open')

@pytest.mark.asyncio
async def test_create_remediation_action():
    action = RemediationAction(result_id=uuid4())
    with patch('requests.post') as mock_post:
        mock_post.return_value.json.return_value = [{
            'id': str(uuid4()),
            'result_id': str(action.result_id),
            'status': 'open',
            'assigned_to': None,
            'verified': False,
            'metadata': {},
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }]
        result = await create_remediation_action(action)
        assert isinstance(result, RemediationAction)

@pytest.mark.asyncio
async def test_get_remediation_action_found():
    action_id = uuid4()
    with patch('requests.get') as mock_get:
        mock_get.return_value.json.return_value = [{'id': str(action_id), 'result_id': str(uuid4()), 'status': 'open', 'assigned_to': None, 'verified': False, 'metadata': {}, 'created_at': datetime.utcnow().isoformat(), 'updated_at': datetime.utcnow().isoformat()}]
        result = await get_remediation_action(action_id)
        assert isinstance(result, RemediationAction)

@pytest.mark.asyncio
async def test_get_remediation_action_not_found():
    action_id = uuid4()
    with patch('requests.get') as mock_get:
        mock_get.return_value.json.return_value = []
        result = await get_remediation_action(action_id)
        assert result is None

@pytest.mark.asyncio
async def test_update_remediation_action():
    action_id = uuid4()
    with patch('requests.patch') as mock_patch:
        mock_patch.return_value.json.return_value = [{
            'id': str(action_id),
            'result_id': str(uuid4()),
            'status': 'resolved',
            'assigned_to': None,
            'verified': False,
            'metadata': {},
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }]
        result = await update_remediation_action(action_id, {'status': 'resolved'})
        assert isinstance(result, RemediationAction)

@pytest.mark.asyncio
async def test_update_remediation_action_not_found():
    action_id = uuid4()
    with patch('requests.patch') as mock_patch:
        mock_patch.return_value.json.return_value = []
        result = await update_remediation_action(action_id, {'status': 'resolved'})
        assert result is None

@pytest.mark.asyncio
async def test_list_remediation_actions():
    with patch('requests.get') as mock_get:
        mock_get.return_value.json.return_value = [
            {'id': str(uuid4()), 'result_id': str(uuid4()), 'status': 'open', 'assigned_to': None, 'verified': False, 'metadata': {}, 'created_at': datetime.utcnow().isoformat(), 'updated_at': datetime.utcnow().isoformat()}
        ]
        result = await list_remediation_actions()
        assert isinstance(result, list)
        assert isinstance(result[0], RemediationAction)

@pytest.mark.asyncio
async def test_update_remediation_status_valid():
    action_id = uuid4()
    with patch('apps.api.compliance_engine.remediation.get_remediation_action', new_callable=AsyncMock) as mock_get, \
         patch('apps.api.compliance_engine.remediation.update_remediation_action', new_callable=AsyncMock) as mock_update:
        mock_get.return_value = RemediationAction(id=action_id, result_id=uuid4(), status='open')
        mock_update.return_value = RemediationAction(id=action_id, result_id=uuid4(), status='in_progress')
        result = await update_remediation_status(action_id, 'in_progress')
        assert result.status == 'in_progress'

@pytest.mark.asyncio
async def test_update_remediation_status_invalid():
    action_id = uuid4()
    with patch('apps.api.compliance_engine.remediation.get_remediation_action', new_callable=AsyncMock) as mock_get:
        mock_get.return_value = RemediationAction(id=action_id, result_id=uuid4(), status='closed')
        with pytest.raises(ValueError):
            await update_remediation_status(action_id, 'in_progress')

@pytest.mark.asyncio
async def test_assign_remediation_action():
    action_id = uuid4()
    user_id = uuid4()
    with patch('apps.api.compliance_engine.remediation.update_remediation_action', new_callable=AsyncMock) as mock_update:
        mock_update.return_value = RemediationAction(id=action_id, result_id=uuid4(), assigned_to=user_id)
        result = await assign_remediation_action(action_id, user_id)
        assert result.assigned_to == user_id

@pytest.mark.asyncio
async def test_verify_remediation_action():
    action_id = uuid4()
    with patch('apps.api.compliance_engine.remediation.update_remediation_action', new_callable=AsyncMock) as mock_update:
        mock_update.return_value = RemediationAction(id=action_id, result_id=uuid4(), verified=True)
        result = await verify_remediation_action(action_id, True)
        assert result.verified is True 