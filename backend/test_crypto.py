import bcrypt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "password"
db_hash = "$2b$12$W1Rdsf0MXDjcX3V3hNBUoutTLRQ2YSli80kll44DT/TnFwj//2tpW"

print(f"Testing password: {password}")
print(f"DB Hash: {db_hash}")

# Test 1: Direct bcrypt
res_bcrypt = bcrypt.checkpw(password.encode(), db_hash.encode())
print(f"Bcrypt checkpw result: {res_bcrypt}")

# Test 2: Passlib verify
res_passlib = pwd_context.verify(password, db_hash)
print(f"Passlib verify result: {res_passlib}")
