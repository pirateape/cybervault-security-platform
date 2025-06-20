import asyncio
from .engine import RuleEngine

class ScanExecutor:
    """
    Orchestrates scan execution:
    - Loads and initializes the rule engine.
    - Executes scans with provided facts.
    - Aggregates and returns results.
    Extensible: Add support for new scan types, aggregation, and orchestration strategies.
    """
    def __init__(self, rules_dir: str):
        """Initialize with rules directory and load rules."""
        self.engine = RuleEngine(rules_dir)
        self.engine.load_rules()

    async def execute_scan(self, facts: dict) -> list:
        """
        Execute a compliance scan with the given facts.
        Returns a list of rule evaluation results.
        """
        results = await self.engine.run(facts)
        return results 