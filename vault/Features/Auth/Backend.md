The backend logic for authentication is centralized in the following implementation:
- **Primary File**: [auth.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/auth.py)
- **Key Functions**:
    - `_resolve_identifier()`: Multi-format username resolution.
    - `login_json()`: Primary JWT issuance endpoint.
    - `_check_brute_force()`: Sentinel L5 detection logic.
    - `_record_failed_attempt()`: Security audit logging.
    - `build_claims()`: JWT payload construction.

## 🔍 Identifier Resolution logic
The system resolves the `username` field into a specific database identifier using the following regex patterns:

| Pattern Type | Regex | Example |
| :--- | :--- | :--- |
| **Email** | `contains @` | `user@institution.edu` |
| **Roll Number** | `^\d{2}NU\dA\d{4}$` | `23NU1A0501` |
| **Employee ID** | `^(FAC\|HOD\|ADM)\d{3}$` | `FAC101`, `HOD202` |

Processing is handled by the `_resolve_identifier` helper function.

## 🛡 Sentinel L5 Brute-Force Protection
Lumina implements a progressive lockout strategy tracked via the `login_attempts` table:
1.  **Detection**: `_check_brute_force` queries failures within a 15-minute sliding window. Linked to [auth.py:L142](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/auth.py#L142).
2.  **Threshold Enforcement**: 
    - `> 5 attempts`: Warn and require CAPTCHA (if integrated).
    - `> 12 attempts`: Hard lockout for 1 hour.
3.  **Recording**: `_record_failed_attempt` persists IP and user-agent metadata for forensic analysis.

## 🔑 Session Management
- **Token Generation**: `create_access_token` and `create_refresh_token` (using `jose` for HS256).
- **Claims**: Includes `sub`, `role`, `onboardingCompleted`, and `adaptiveOnboardingCompleted`.
- **Revocation**: `blacklist_token` stores revoked JTI in Redis with TTL matching the token expiry.

## ⚙️ Key Functions
- `login_for_access_token`: Main entry point for user authentication.
- `refresh_token`: Issues new access tokens using a valid refresh token.
- `logout`: Revokes the current session and blacklists the token.
- `onboarding_status`: Returns 100% ground truth on where the user is in their lifecycle.

## ⚠️ Failure Points & Risk Analysis

### Failure Points
- **Supabase Connectivity**: If the `users` or `login_attempts` tables are unreachable, authentication fails system-wide.
- **Redis Outage**: Prevents JWT blacklisting during logout, creating a security window for stolen tokens.
- **Identifier Masking**: Overlapping regex patterns for Roll Numbers and Employee IDs could cause resolution collisions if not strictly maintained.
- **Sentinel Misconfiguration**: Overly aggressive lockout thresholds could lock out an entire institution if a campus-wide IP is used.

### Risk Level: CRITICAL
- **Reasoning**: Authentication is the foundation of the Lumina ecosystem. A failure here results in a total system blackout and high security risk regarding PII (Personally Identifiable Information).

