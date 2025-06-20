import logging
from typing import Any, Dict, Optional, Callable, List

class DataIngestionPipeline:
    """
    Modular data ingestion pipeline for compliance engine.
    - Collects, validates, and preprocesses input data from multiple sources (API, file, cloud, etc.).
    - Transforms data into canonical 'facts' format for rule engine.
    - Extensible: register new sources, validators, and transformers.
    - Robust error handling and logging.
    """
    def __init__(self):
        self.sources: Dict[str, Callable[..., Dict[str, Any]]] = {}
        self.validators: List[Callable[[Dict[str, Any]], bool]] = []
        self.transformers: List[Callable[[Dict[str, Any]], Dict[str, Any]]] = []

    def register_source(self, name: str, loader: Callable[..., Dict[str, Any]]):
        """Register a new data source loader function."""
        self.sources[name] = loader

    def register_validator(self, validator: Callable[[Dict[str, Any]], bool]):
        """Register a new data validator function."""
        self.validators.append(validator)

    def register_transformer(self, transformer: Callable[[Dict[str, Any]], Dict[str, Any]]):
        """Register a new data transformer function."""
        self.transformers.append(transformer)

    def collect(self, source: str, **kwargs) -> Dict[str, Any]:
        """Collect data from a registered source."""
        if source not in self.sources:
            raise ValueError(f"Data source '{source}' not registered.")
        try:
            data = self.sources[source](**kwargs)
            logging.info(f"Collected data from source '{source}'.")
            return data
        except Exception as e:
            logging.error(f"Error collecting data from source '{source}': {e}")
            raise

    def validate(self, data: Dict[str, Any]) -> bool:
        """Run all registered validators on the data."""
        for validator in self.validators:
            if not validator(data):
                logging.error("Data validation failed.")
                return False
        logging.info("Data validation passed.")
        return True

    def preprocess(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Apply all registered transformers to the data."""
        for transformer in self.transformers:
            data = transformer(data)
        logging.info("Data preprocessing complete.")
        return data

    def ingest(self, source: str, **kwargs) -> Optional[Dict[str, Any]]:
        """
        Full ingestion pipeline: collect, validate, preprocess, and return canonical facts.
        Returns None if validation fails.
        """
        data = self.collect(source, **kwargs)
        if not self.validate(data):
            return None
        facts = self.preprocess(data)
        return facts

def ai_risk_preprocessing_transformer(data: dict) -> dict:
    # Fill missing fields with defaults
    data = dict(data)  # Defensive copy
    data.setdefault("severity", "medium")
    data.setdefault("compliance_framework", "NIST")
    data.setdefault("details", {})
    # Coerce types
    data["severity"] = str(data["severity"]).lower()
    data["org_id"] = str(data.get("org_id", ""))
    data["scan_id"] = str(data.get("scan_id", ""))
    data["user_id"] = str(data.get("user_id", ""))
    data["finding"] = str(data.get("finding", ""))
    # Normalize categorical values
    if data["severity"] not in ("low", "medium", "high"):
        data["severity"] = "medium"
    # Ensure all required fields for AI model
    required = ["org_id", "scan_id", "user_id", "finding", "severity", "compliance_framework", "details"]
    for field in required:
        if field not in data:
            data[field] = "" if field != "details" else {}
    return data

# Register the transformer for AI risk analysis
DataIngestionPipeline.register_transformer = staticmethod(lambda transformer: DataIngestionPipeline.transformers.append(transformer))
DataIngestionPipeline.transformers = [ai_risk_preprocessing_transformer] 