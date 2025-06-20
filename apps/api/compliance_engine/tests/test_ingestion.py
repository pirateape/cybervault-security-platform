import pytest
from apps.api.compliance_engine.ingestion import DataIngestionPipeline

def test_register_and_collect_source():
    pipeline = DataIngestionPipeline()
    pipeline.register_source('test', lambda x=1: {'val': x})
    data = pipeline.collect('test', x=42)
    assert data['val'] == 42

def test_register_and_validate():
    pipeline = DataIngestionPipeline()
    pipeline.register_source('test', lambda: {'val': 2})
    pipeline.register_validator(lambda d: d['val'] > 0)
    data = pipeline.collect('test')
    assert pipeline.validate(data) is True
    pipeline.register_validator(lambda d: d['val'] < 0)
    assert pipeline.validate(data) is False

def test_register_and_transform():
    pipeline = DataIngestionPipeline()
    pipeline.register_source('test', lambda: {'val': 2})
    pipeline.register_transformer(lambda d: {'val': d['val'] * 10})
    data = pipeline.collect('test')
    transformed = pipeline.preprocess(data)
    assert transformed['val'] == 20

def test_full_ingestion_pass():
    pipeline = DataIngestionPipeline()
    pipeline.register_source('test', lambda: {'val': 2})
    pipeline.register_validator(lambda d: d['val'] > 0)
    pipeline.register_transformer(lambda d: {'val': d['val'] + 1})
    facts = pipeline.ingest('test')
    assert facts['val'] == 3

def test_full_ingestion_fail():
    pipeline = DataIngestionPipeline()
    pipeline.register_source('test', lambda: {'val': -1})
    pipeline.register_validator(lambda d: d['val'] > 0)
    facts = pipeline.ingest('test')
    assert facts is None

def test_collect_unregistered_source():
    pipeline = DataIngestionPipeline()
    with pytest.raises(ValueError):
        pipeline.collect('not_registered')

def test_collect_exception_handling(monkeypatch):
    pipeline = DataIngestionPipeline()
    def bad_loader():
        raise RuntimeError('fail')
    pipeline.register_source('bad', bad_loader)
    with pytest.raises(RuntimeError):
        pipeline.collect('bad')

def test_validate_logs_error(monkeypatch):
    pipeline = DataIngestionPipeline()
    pipeline.register_validator(lambda d: False)
    assert pipeline.validate({'foo': 1}) is False

def test_preprocess_logs_info(monkeypatch):
    pipeline = DataIngestionPipeline()
    pipeline.register_transformer(lambda d: {**d, 'bar': 2})
    data = pipeline.preprocess({'foo': 1})
    assert data['bar'] == 2 