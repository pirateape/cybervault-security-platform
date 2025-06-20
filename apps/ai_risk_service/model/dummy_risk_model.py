def generate_recommendation(risk_score, finding, severity, compliance_framework, details):
    # Map risk to action
    if risk_score >= 0.7:
        base = "Immediate remediation required."
    elif risk_score >= 0.4:
        base = "Prioritized review and mitigation recommended."
    else:
        base = "Monitor and review as part of regular compliance checks."
    # Compliance-specific advice
    framework = (compliance_framework or "").upper()
    compliance_advice = ""
    if framework == "NIST":
        compliance_advice = " Ensure controls align with NIST SP 800-53 requirements."
    elif framework == "CIS":
        compliance_advice = " Review against CIS Controls for best practices."
    elif framework == "ISO 27001":
        compliance_advice = " Document actions for ISO 27001 audit trail."
    elif framework == "GDPR":
        compliance_advice = " Ensure data handling is GDPR-compliant and document remediation steps."
    elif framework == "HIPAA":
        compliance_advice = " Ensure all ePHI is encrypted and access is logged for HIPAA compliance."
    elif framework == "PCI DSS":
        compliance_advice = " Segment cardholder data environment and enforce strict access controls for PCI DSS compliance."
    elif framework == "SOC 2":
        compliance_advice = " Document all remediation actions for SOC 2 audit trail and ensure continuous monitoring."
    elif framework == "CSA CCM":
        compliance_advice = " Align controls with CSA Cloud Controls Matrix for cloud security best practices."
    else:
        compliance_advice = " Review according to your organization's compliance framework."
    # Modular best-practice triggers
    advice = []
    finding_str = str(finding or "").lower()
    # Zero Trust
    if any(word in finding_str for word in ["trust", "network segmentation", "microsegmentation"]):
        advice.append("Adopt a Zero Trust approach—verify all users and devices, and minimize implicit trust.")
    # OWASP
    if any(word in finding_str for word in ["web", "xss", "sql injection", "csrf", "owasp"]):
        advice.append("Review application for OWASP Top 10 vulnerabilities and remediate accordingly.")
    # Data minimization
    if "data" in finding_str and "minimization" in finding_str:
        advice.append("Review data retention policies and minimize data collection to only what is necessary.")
    # Incident response
    if risk_score >= 0.7 or "incident" in finding_str:
        advice.append("Update incident response plans and conduct tabletop exercises for preparedness.")
    # User training
    if any(word in finding_str for word in ["phishing", "social engineering", "user awareness"]):
        advice.append("Conduct regular user security awareness training and phishing simulations.")
    # Supply chain
    if any(word in finding_str for word in ["third-party", "vendor", "supply chain"]):
        advice.append("Assess supply chain risks and require security attestations from vendors.")
    # Automation
    if any(word in finding_str for word in ["repeat", "automation", "script"]):
        advice.append("Implement automated remediation scripts for recurring issues to reduce manual effort.")
    # Monitoring
    if any(word in finding_str for word in ["monitor", "alert", "continuous"]):
        advice.append("Enable continuous monitoring and alerting for critical assets and compliance controls.")
    # Cloud
    if any(word in finding_str for word in ["cloud", "aws", "azure", "gcp"]):
        advice.append("Review cloud security posture and align with CSA CCM and cloud provider best practices.")
    # Existing finding-specific advice
    if "mfa" in finding_str:
        advice.append("Multi-factor authentication should be enforced for all users.")
    if "encryption" in finding_str:
        advice.append("Ensure encryption is enabled for all sensitive data.")
    if "access" in finding_str:
        advice.append("Review access controls and least privilege assignments.")
    # Details-based advice
    if details and isinstance(details, dict):
        if details.get("control") == "MFA":
            advice.append("Enable MFA for all accounts.")
        if details.get("control") == "Encryption":
            advice.append("Apply encryption at rest and in transit.")
    # Compose final recommendation
    return base + " " + " ".join(advice) + compliance_advice

class DummyRiskModel:
    def __init__(self):
        self.version = "v0.1-dummy"

    def predict(self, features: dict) -> dict:
        # Simple logic: high severity = high risk, else low risk
        severity = features.get("severity", "medium")
        score = 0.7 if severity == "high" else 0.3 if severity == "medium" else 0.1
        recommendation = generate_recommendation(
            risk_score=score,
            finding=features.get("finding"),
            severity=severity,
            compliance_framework=features.get("compliance_framework"),
            details=features.get("details")
        )
        return {
            "risk_score": score,
            "recommendation": recommendation,
            "model_version": self.version,
        } 