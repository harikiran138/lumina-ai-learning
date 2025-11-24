#!/bin/bash
# Script to reset password for lumina_user in PostgreSQL

echo "Connecting to PostgreSQL as superuser to reset lumina_user password..."

psql -U postgres <<EOF
ALTER USER lumina_user WITH PASSWORD 'your_new_password';
\q
EOF

echo "Password reset complete. Please update lumnia/api/.env with the new password and restart the API server."
