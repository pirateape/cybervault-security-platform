import httpx
import os

AI_RISK_SERVICE_URL = os.getenv("AI_RISK_SERVICE_URL", "http://localhost:8001/predict")

async def get_risk_analysis(scan_result: dict, jwt_token: str, timeout: float = 5.0) -> dict:
    headers = {"Authorization": f"Bearer {jwt_token}"}
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            resp = await client.post(AI_RISK_SERVICE_URL, json=scan_result, headers=headers)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            # Log and propagate error
            raise RuntimeError(f"AI Risk Service error: {e.response.status_code} {e.response.text}") from e
        except Exception as e:
            raise RuntimeError(f"AI Risk Service request failed: {e}") from e 