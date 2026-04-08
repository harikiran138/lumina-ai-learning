# Lumina AWS Instance Report: i-0d4e09a2187e05b2b

**Target Instance**: `i-0d4e09a2187e05b2b`  
**Public IP**: `43.204.36.40`  
**User**: `ubuntu`  
**Status**: 🟢 ACCESSIBLE | 🔴 SERVICES DOWN  

---

## 💻 System Information

| Property | Value |
| :--- | :--- |
| **Operating System** | Ubuntu 24.04 LTS (GNU/Linux 6.8.0-1004-aws x86_64) |
| **Memory** | 914 MiB (~1GB) |
| **Swap** | 8,191 MiB (~8GB) |
| **Disk Usage**| 49G total, 21G used (43% used) |
| **Disk Available** | 28 GB FREE |

---

## 📂 Repository State

The repository is located at `/home/ubuntu/lumina-ai-learning`.

- **Current Branch**: `main` (Assumed from recent `ls`)
- **Key Files Present**:
  - `docker-compose.prod.yml`
  - `deploy/deploy.sh`
  - `backend/`
  - `frontend/`
  - `Analytics-Agent/`
- **Missing Files**:
  - `backend/.env.prod` (Required for production start)

---

## 🐳 Docker Status

### Containers
Current Status: **NO CONTAINERS RUNNING**  
Last activity detected in logs at **00:37:07 UTC** (TaskDelete events). It appears the stack was recently stopped or failed to stay up.

### Images Present
| Repository | Tag | Created | Size |
| :--- | :--- | :--- | :--- |
| **<none>** | <none> | ~10 mins ago | 2.77GB |
| **neo4j** | 5-community | 6 days ago | 600MB |
| **postgres** | 16-alpine | 5 weeks ago | 276MB |
| **redis** | 7-alpine | 6 weeks ago | 41.4MB |
| **minio/minio** | latest | 7 months ago | 175MB |
| **nginx** | alpine | 13 days ago | 62.2MB |

---

## 🌐 Network Status

| Port | Protocol | Service | Status |
| :--- | :--- | :--- | :--- |
| **80** | TCP | Nginx | **LISTENING** |
| **22** | TCP | SSH | **LISTENING** |
| **8000** | TCP | Backend | 🔴 CLOSED |
| **3000** | TCP | Frontend | 🔴 CLOSED |

---

## 📜 Recent Activity Notes (from Docker Logs)
- **00:32:59**: Image pruning activity.
- **00:34:21**: Container task delete (moby).
- **00:37:07**: Final container task delete observed.

**Recommendation**: To bring the instance back online, a valid `.env` file needs to be configured, followed by `docker compose -f docker-compose.prod.yml up -d`.
