import socket
import psycopg2
from concurrent.futures import ThreadPoolExecutor, as_completed

project_ref = 'odyjksznsdeyweylovzl'
password = 'Lumin@138800'

aws_regions = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'ap-south-1', 'ap-northeast-1', 'ap-northeast-2', 'ap-southeast-1', 'ap-southeast-2',
    'ca-central-1', 'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3',
    'eu-north-1', 'sa-east-1'
]

urls_to_test = []
for region in aws_regions:
    host = f'aws-0-{region}.pooler.supabase.com'
    urls_to_test.append(f"postgresql://postgres.{project_ref}:{password}@{host}:6543/postgres")
    urls_to_test.append(f"postgresql://postgres.{project_ref}:{password}@{host}:5432/postgres")


def test_connection(url):
    try:
        conn = psycopg2.connect(url, connect_timeout=3)
        conn.close()
        return f"SUCCESS: {url}"
    except Exception as e:
        return f"FAIL: {url} - {str(e).splitlines()[0]}"

print("Testing pooler URLs...")
with ThreadPoolExecutor(max_workers=10) as executor:
    futures = {executor.submit(test_connection, url): url for url in urls_to_test}
    for future in as_completed(futures):
        res = future.result()
        if "SUCCESS" in res:
            print(f">>> FOUND WORKING CONNECTION: {res}")
            executor.shutdown(wait=False, cancel_futures=True)
            break
        elif "authentication failed" in res.lower() or "password" in res.lower() or "tenant or user not found" in res.lower():
            pass # ignore generic failure to not clog output

print("Done scanning.")
