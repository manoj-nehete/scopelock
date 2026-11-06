# Security

ScopeLock executes user-approved local commands with the user's permissions. Inspect exact commands, arguments and working directories before approval. It is not an execution sandbox or an authorization boundary against an agent that already has filesystem and shell access.

The dashboard binds to loopback and validates host, origin and mutation tokens. Do not expose it through a public proxy. Log redaction detects common patterns but cannot guarantee all secrets are removed. Evidence and backups may contain private information. Review before sharing.

For a vulnerability, contact the repository maintainer privately once the public repository and contact are established. Do not place credentials or exploit details in a public issue. A maintained private reporting contact is a release prerequisite.
