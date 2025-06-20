import os
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
import json

def get_secret_from_keyvault(secret_ref: str) -> dict:
    """
    Fetch a secret from Azure Key Vault given a secret_ref (full URL or name).
    Returns the secret as a dict (expects JSON-formatted secret value).
    """
    keyvault_url = os.getenv("AZURE_KEYVAULT_URL")
    if not keyvault_url:
        raise Exception("AZURE_KEYVAULT_URL not set")
    credential = DefaultAzureCredential()
    client = SecretClient(vault_url=keyvault_url, credential=credential)
    # secret_ref can be a name or full identifier
    if secret_ref.startswith("https://"):
        # Parse name from URL
        name = secret_ref.split("/secrets/")[-1].split("/")[0]
    else:
        name = secret_ref
    secret = client.get_secret(name)
    try:
        return json.loads(secret.value)
    except Exception:
        raise Exception("Secret value is not valid JSON") 