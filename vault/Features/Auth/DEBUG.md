# Debug Playbook: Authentication (Auth)

Use this guide to diagnose and resolve issues related to user access, Sentinel lockouts, and identity resolution.

## 🚨 Common Failure Scenarios

### 1. User Locked Out (Sentinel L5)
- **Symptoms**: User receives `423 Locked` or "Too many failed attempts".
- **Check**: Look for active locks in the `login_attempts` table.
- **Resolution**: Delete the row for the user's `identifier` + `ip_address` in the DB.
- **Backend File**: [auth.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/auth.py#L254-L315)

### 2. Identifier Resolution Failure
- **Symptoms**: User cannot login with Employee ID or Roll Number, only Email.
- **Check**: Verify if the ID matches the architecture standard:
    - Roll Number: `\d{2}NU\dA\d{4}` (e.g., 21NU1A0501)
    - Employee ID: `(FAC|HOD|ADM)\d{3}` (e.g., FAC001)
- **Backend File**: [auth.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/auth.py#L25-L27)

### 3. JWT Token Invalid/Expired
- **Symptoms**: 401 Unauthorized errors on valid sessions.
- **Check**:
    - Verify `JWT_SECRET` in `.env` matches the backend config.
    - Check if the token JTI is in the **Redis Blacklist**.
- **Log to Inspect**: `refresh_token_decode_failed` or `refresh_token_reuse_detected`.

## 🛠 Step-by-Step Debug Path
1. **Frontend**: Check Browser Console Network tab. Inspect `access_token` cookie.
2. **Backend Entry**: [middleware.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/core/middleware.py) (Sentinel check).
3. **Store**: [user_store.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/store/user_store.py) (Fetch user row).
4. **DB**: Perform `SELECT * FROM users WHERE email = '...'`.

## 📊 Error Codes to Watch
- `INTERNAL_SERVER_ERROR (500)`: likely Supabase connection loss.
- `UNAUTHORIZED (401)`: Password mismatch or token invalid.
- `FORBIDDEN (403)`: Account inactive or Role missing permissions.

---
[[IMPACT]] | [[DEPENDENCY_MAP]] | [[Features/Auth/Overview]]
