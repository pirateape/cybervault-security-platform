import pytest
import asyncio
from apps.api.compliance_engine.facts import FactRegistry

@pytest.fixture
def registry():
    return FactRegistry()

def test_register_and_get_fact_handler(registry):
    def handler(x):
        return x + 1
    registry.register('test.fact', handler)
    assert registry.get('test.fact') is handler

@pytest.mark.asyncio
async def test_resolve_sync_handler(registry):
    def handler(x):
        return x * 2
    registry.register('test.sync', handler)
    result = await registry.resolve('test.sync', 3)
    assert result == 6

@pytest.mark.asyncio
async def test_resolve_async_handler(registry):
    async def handler(x):
        await asyncio.sleep(0.01)
        return x * 3
    registry.register('test.async', handler)
    result = await registry.resolve('test.async', 4)
    assert result == 12

def test_get_missing_fact_handler_raises(registry):
    with pytest.raises(KeyError):
        registry.get('missing.fact') 