from typing import Callable, Dict, Any, Awaitable
import asyncio

class FactRegistry:
    """
    Registry for fact handler functions.
    - register(name, handler): Register a fact handler (sync or async).
    - get(name): Retrieve a handler by name.
    - resolve(name, *args, **kwargs): Call the handler (await if async).
    Extensible: Add new facts by registering new handler functions.
    """
    def __init__(self):
        self._registry: Dict[str, Callable[..., Any]] = {}

    def register(self, name: str, handler: Callable[..., Any]):
        self._registry[name] = handler

    def get(self, name: str) -> Callable[..., Any]:
        if name not in self._registry:
            raise KeyError(f"Fact handler '{name}' not found.")
        return self._registry[name]

    async def resolve(self, name: str, *args, **kwargs) -> Any:
        handler = self.get(name)
        if asyncio.iscoroutinefunction(handler):
            return await handler(*args, **kwargs)
        return handler(*args, **kwargs)

# Example: Register a sample fact handler
fact_registry = FactRegistry()

# Example async fact handler for 'user.mfa_enabled'
async def user_mfa_enabled(user: dict) -> bool:
    """
    Returns True if the user has MFA enabled. Extend with real data source as needed.
    """
    return user.get('mfa_enabled', False)

fact_registry.register('user.mfa_enabled', user_mfa_enabled) 