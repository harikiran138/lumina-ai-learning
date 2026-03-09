from typing import Optional, List
from datetime import datetime
import uuid
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog
from app.store.local_store import LocalJsonStore

log = structlog.get_logger()


class InstitutionStore:
    """
    Supabase store for Institutions, Departments, and Stakeholders.
    """

    def __init__(self):
        self.client = supabase_db.get_client()
        self.local = LocalJsonStore()

    # --- Institution CRUD ---

    async def create_institution(self, data: dict) -> dict:
        if self.client is None:
            payload = self.local.read()
            if "institutions" not in payload:
                payload["institutions"] = []
            
            record = {
                "id": str(uuid.uuid4()),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                **data
            }
            payload["institutions"].append(record)
            self.local.write(payload)
            return record

        try:
            response = self.client.table("institutions").insert(data).execute()
            if not response.data:
                raise Exception("Failed to create institution")
            return response.data[0]
        except Exception as e:
            log.error("create_institution_failed", error=str(e))
            raise e

    async def get_institution(self, inst_id: str) -> Optional[dict]:
        if self.client is None:
            payload = self.local.read()
            return next((item for item in payload.get("institutions", []) if item.get("id") == inst_id), None)
        
        try:
            response = self.client.table("institutions").select("*").eq("id", inst_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            log.error("get_institution_failed", error=str(e))
            return None

    async def list_institutions(self) -> List[dict]:
        if self.client is None:
            payload = self.local.read()
            return payload.get("institutions", [])
        
        try:
            response = self.client.table("institutions").select("*").execute()
            return response.data
        except Exception as e:
            log.error("list_institutions_failed", error=str(e))
            return []

    # --- Department CRUD ---

    async def create_department(self, data: dict) -> dict:
        if self.client is None:
            payload = self.local.read()
            if "departments" not in payload:
                payload["departments"] = []
            
            record = {
                "id": str(uuid.uuid4()),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                **data
            }
            payload["departments"].append(record)
            self.local.write(payload)
            return record

        try:
            response = self.client.table("departments").insert(data).execute()
            if not response.data:
                raise Exception("Failed to create department")
            return response.data[0]
        except Exception as e:
            log.error("create_department_failed", error=str(e))
            raise e

    async def list_departments(self, inst_id: str) -> List[dict]:
        if self.client is None:
            payload = self.local.read()
            return [d for d in payload.get("departments", []) if d.get("institution_id") == inst_id]
        
        try:
            response = self.client.table("departments").select("*").eq("institution_id", inst_id).execute()
            return response.data
        except Exception as e:
            log.error("list_departments_failed", error=str(e))
            return []

    # --- Program CRUD ---

    async def create_program(self, data: dict) -> dict:
        if self.client is None:
            payload = self.local.read()
            if "programs" not in payload:
                payload["programs"] = []
            
            record = {
                "id": str(uuid.uuid4()),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                **data
            }
            payload["programs"].append(record)
            self.local.write(payload)
            return record

        try:
            response = self.client.table("programs").insert(data).execute()
            if not response.data:
                raise Exception("Failed to create program")
            return response.data[0]
        except Exception as e:
            log.error("create_program_failed", error=str(e))
            raise e

    async def list_programs(self, inst_id: str) -> List[dict]:
        if self.client is None:
            payload = self.local.read()
            return [p for p in payload.get("programs", []) if p.get("institution_id") == inst_id]
        
        try:
            response = self.client.table("programs").select("*").eq("institution_id", inst_id).execute()
            return response.data
        except Exception as e:
            log.error("list_programs_failed", error=str(e))
            return []

    # --- Stakeholder CRUD (Connections) ---

    async def create_stakeholder(self, data: dict) -> dict:
        if self.client is None:
            payload = self.local.read()
            if "stakeholders" not in payload:
                payload["stakeholders"] = []
            
            record = {
                "id": str(uuid.uuid4()),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                **data
            }
            payload["stakeholders"].append(record)
            self.local.write(payload)
            return record

        try:
            response = self.client.table("stakeholders").insert(data).execute()
            if not response.data:
                raise Exception("Failed to create stakeholder")
            return response.data[0]
        except Exception as e:
            log.error("create_stakeholder_failed", error=str(e))
            raise e

    async def list_stakeholders(self, inst_id: Optional[str] = None, program_id: Optional[str] = None) -> List[dict]:
        if self.client is None:
            payload = self.local.read()
            stakeholders = payload.get("stakeholders", [])
            if inst_id:
                stakeholders = [s for s in stakeholders if s.get("institution_id") == inst_id]
            if program_id:
                stakeholders = [s for s in stakeholders if s.get("program_id") == program_id]
            return stakeholders
        
        try:
            query = self.client.table("stakeholders").select("*")
            if inst_id:
                query = query.eq("institution_id", inst_id)
            if program_id:
                query = query.eq("program_id", program_id)
            response = query.execute()
            return response.data
        except Exception as e:
            log.error("list_stakeholders_failed", error=str(e))
            return []
