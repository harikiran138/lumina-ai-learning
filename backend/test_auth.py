from passlib.context import CryptContext
import bcrypt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "password"
hash_from_db = "$2b$12$W1Rdsf0MXDjcX3V3hNBUoutTLRQ2YSli80kll44DT/TnFwj//2tpW"

print(f"Password: {password}")
print(f"Hash from DB: {hash_from_db}")

# Verify using passlib (as backend does)
try:
    res = pwd_context.verify(password, hash_from_db)
    print(f"Passlib verify: {res}")
except Exception as e:
    print(f"Passlib verify error: {e}")

# Verify using bcrypt directly
try:
    res_bcrypt = bcrypt.checkpw(password.encode(), hash_from_db.encode())
    print(f"Bcrypt checkpw: {res_bcrypt}")
except Exception as e:
    print(f"Bcrypt error: {e}")
