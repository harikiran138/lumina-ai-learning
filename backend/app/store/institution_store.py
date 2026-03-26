from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()


class InstitutionStore:
    """
    Supabase store for Institutions, Departments, and Stakeholders.
    """

    def __init__(self):
        self.db = supabase_db

    # --- Institution CRUD ---

    async def create_institution(self, data: dict) -> dict:
        try:
            # Ensure default onboarding status
            if "onboarding_status" not in data:
                data["onboarding_status"] = "PENDING"
            
            result = await self.db.upsert("institutions", data)
            if result:
                log.info("institution_created", id=result[0].get("id"), status=data["onboarding_status"])
                return result[0]
            raise Exception("Failed to create institution")
        except Exception as e:
            log.error("create_institution_failed", error=str(e))
            raise e

    async def update_institution_status(self, inst_id: str, status: str) -> bool:
        """Explicitly update the onboarding status of an institution."""
        try:
            client = self.db.get_client()
            response = client.table("institutions").update({
                "onboarding_status": status,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", inst_id).execute()
            
            if response.data:
                log.info("institution_status_updated", id=inst_id, status=status)
                return True
            return False
        except Exception as e:
            log.error("update_institution_status_failed", error=str(e), id=inst_id)
            return False

    async def get_institution(self, inst_id: str) -> Optional[dict]:
        try:
            return await self.db.fetch_one("institutions", {"id": inst_id})
        except Exception as e:
            log.error("get_institution_failed", error=str(e))
            return None

    async def list_institutions(self) -> List[dict]:
        try:
            return await self.db.fetch_all("institutions")
        except Exception as e:
            log.error("list_institutions_failed", error=str(e))
            return []

    # --- Department CRUD ---

    async def create_department(self, data: dict) -> dict:
        try:
            result = await self.db.upsert("departments", data)
            if result:
                return result[0]
            raise Exception("Failed to create department")
        except Exception as e:
            log.error("create_department_failed", error=str(e))
            raise e

    async def list_departments(self, inst_id: str) -> List[dict]:
        try:
            return await self.db.fetch_all("departments", {"institution_id": inst_id})
        except Exception as e:
            log.error("list_departments_failed", error=str(e), inst_id=inst_id)
            return []

    # --- Program CRUD ---

    async def create_program(self, data: dict) -> dict:
        try:
            result = await self.db.upsert("programs", data)
            if result:
                return result[0]
            raise Exception("Failed to create program")
        except Exception as e:
            log.error("create_program_failed", error=str(e))
            raise e

    async def list_programs(self, inst_id: str) -> List[dict]:
        try:
            return await self.db.fetch_all("programs", {"institution_id": inst_id})
        except Exception as e:
            log.error("list_programs_failed", error=str(e), inst_id=inst_id)
            return []

    # --- Stakeholder CRUD (Connections) ---

    async def create_stakeholder(self, data: dict) -> dict:
        try:
            # Attempt to find existing stakeholder to update
            client = self.db.get_client()
            query = client.table("stakeholders").select("*")
            if data.get("user_id"):
                query = query.eq("user_id", data["user_id"])
            if data.get("institution_id"):
                query = query.eq("institution_id", data["institution_id"])
            if data.get("program_id"):
                query = query.eq("program_id", data["program_id"])

            existing = query.limit(1).execute()
            if existing.data:
                sid = existing.data[0]["id"]
                data["updated_at"] = datetime.utcnow().isoformat()
                res = client.table("stakeholders").update(data).eq("id", sid).execute()
                return res.data[0] if res.data else existing.data[0]

            res = client.table("stakeholders").insert(data).execute()
            
            # Logic Update: If an institution is linked for the first time, progress its onboarding status
            if data.get("institution_id"):
                inst = await self.get_institution(data["institution_id"])
                if inst and inst.get("onboarding_status") == "PENDING":
                    await self.update_institution_status(data["institution_id"], "ACTIVE")
                    log.info("institution_auto_activated", id=data["institution_id"])

            return res.data[0]
        except Exception as e:
            log.error("create_stakeholder_failed", error=str(e))
            raise e

    async def list_stakeholders(self, inst_id: Optional[str] = None, program_id: Optional[str] = None) -> List[dict]:
        try:
            filters = {}
            if inst_id: filters["institution_id"] = inst_id
            if program_id: filters["program_id"] = program_id
            return await self.db.fetch_all("stakeholders", filters)
        except Exception as e:
            log.error("list_stakeholders_failed", error=str(e))
            return []
