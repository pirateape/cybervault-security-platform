Compliance Checks and Automated Code Examples
NIST SP 800-53
Control: Access Control (AC-2).
Automated Check: Scan Azure Entra ID for users with elevated privileges without multi-factor authentication (MFA).
Code Example:

```python

Check for users without MFA in Azure Entra ID
def check_mfa_compliance(users):

for user in users:

if not user.mfa_enabled:

print(f"User {user.name} lacks MFA compliance.")

```

ISO 27001
Control: Information Security Policies (A.8.1.1).
Automated Check: Verify that Microsoft 365 tenant policies enforce data encryption.
Code Example:

```python

Check for encryption policies in Microsoft 365
def check_encryption_policies(tenant):

if not tenant.encryption_enabled:

print("Tenant lacks encryption policies.")

```

CIS Controls
Control: Disable Unused Accounts (CIS 1.2).
Automated Check: Identify inactive users in Azure Entra ID.
Code Example:

```python

Check for inactive users in Azure Entra ID
def check_inactive_users(users):

for user in users:

if user.last_login > 90 days:

print(f"User {user.name} is inactive.")

```

Essential 8
Control: Patch Applications (E8.1).
Automated Check: Ensure all Microsoft 365 and Azure services are up to date.
Code Example:

```python

Check for outdated software in Azure
def check_software_patches(azure_services):

for service in azure_services:

if service.last_patch_date < 30 days:

print(f"Service {service.name} is outdated.")

```
