import re

with open('/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/supabase/.temp/all_lumina_migrations.sql', 'r') as f:
    sql = f.read()

# Remove all DROP TABLE statements
sql = re.sub(r'DROP TABLE IF EXISTS .*?;\n', '', sql)

# Ensure all CREATE TABLE statements have IF NOT EXISTS
sql = re.sub(r'CREATE TABLE (\w+)', r'CREATE TABLE IF NOT EXISTS \1', sql)
# Fix double IF NOT EXISTS
sql = sql.replace('CREATE TABLE IF NOT EXISTS IF NOT EXISTS', 'CREATE TABLE IF NOT EXISTS')

# Check Indexes
sql = re.sub(r'CREATE INDEX (\w+)', r'CREATE INDEX IF NOT EXISTS \1', sql)
sql = sql.replace('CREATE INDEX IF NOT EXISTS IF NOT EXISTS', 'CREATE INDEX IF NOT EXISTS')

with open('/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/sync_schema_safe.sql', 'w') as f:
    f.write(sql)

print("Created safe migration script.")
