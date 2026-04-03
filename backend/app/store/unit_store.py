from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from app.core.logging import structlog
from app.database.supabase_manager import supabase_db

log = structlog.get_logger()


class UnitStore:
    def __init__(self):
        self.db = supabase_db

    async def create_unit(
        self,
        *,
        unit_id: str,
        teacher_id: str,
        title: str,
        original_filename: str,
        source_file_url: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[dict]:
        now = datetime.utcnow().isoformat()
        return await self.db.insert(
            "units",
            {
                "id": unit_id,
                "teacher_id": teacher_id,
                "title": title,
                "original_filename": original_filename,
                "source_file_url": source_file_url,
                "status": "parsing",
                "metadata": metadata or {},
                "created_at": now,
                "updated_at": now,
            },
        )

    async def get_unit(self, unit_id: str) -> Optional[dict]:
        return await self.db.fetch_one("units", {"id": unit_id})

    async def get_unit_for_teacher(self, unit_id: str, teacher_id: str) -> Optional[dict]:
        unit = await self.get_unit(unit_id)
        if not unit or str(unit.get("teacher_id")) != str(teacher_id):
            return None
        return unit

    async def list_units_for_teacher(self, teacher_id: str) -> List[dict]:
        try:
            response = (
                self.db.get_client()
                .table("units")
                .select("*")
                .eq("teacher_id", teacher_id)
                .order("created_at", desc=True)
                .async_execute()
            )
            return response.data or []
        except Exception as exc:
            log.error("list_units_failed", teacher_id=teacher_id, error=str(exc))
            return []

    async def update_unit(self, unit_id: str, updates: Dict[str, Any]) -> Optional[dict]:
        updates = dict(updates)
        updates["updated_at"] = datetime.utcnow().isoformat()
        return await self.db.update("units", updates, {"id": unit_id})

    async def create_processing_job(
        self,
        *,
        unit_id: str,
        job_type: str,
        status: str = "queued",
        payload: Optional[Dict[str, Any]] = None,
        topic_id: Optional[str] = None,
    ) -> Optional[dict]:
        now = datetime.utcnow().isoformat()
        return await self.db.insert(
            "unit_processing_jobs",
            {
                "unit_id": unit_id,
                "topic_id": topic_id,
                "job_type": job_type,
                "status": status,
                "attempts": 0,
                "payload": payload or {},
                "created_at": now,
                "updated_at": now,
            },
        )

    async def update_processing_job(self, job_id: str, updates: Dict[str, Any]) -> Optional[dict]:
        updates = dict(updates)
        updates["updated_at"] = datetime.utcnow().isoformat()
        return await self.db.update("unit_processing_jobs", updates, {"id": job_id})

    async def list_jobs_for_unit(self, unit_id: str) -> List[dict]:
        try:
            response = (
                self.db.get_client()
                .table("unit_processing_jobs")
                .select("*")
                .eq("unit_id", unit_id)
                .order("created_at", desc=False)
                .async_execute()
            )
            return response.data or []
        except Exception as exc:
            log.error("list_unit_jobs_failed", unit_id=unit_id, error=str(exc))
            return []

    async def replace_unit_structure(self, unit_id: str, parsed_unit: Dict[str, Any]) -> Dict[str, List[dict]]:
        client = self.db.get_client()
        now = datetime.utcnow().isoformat()

        await client.table("topic_assets").delete().eq("unit_id", unit_id).async_execute()
        await client.table("unit_processing_jobs").delete().eq("unit_id", unit_id).eq("job_type", "topic_enrichment").async_execute()
        await client.table("unit_topics").delete().eq("unit_id", unit_id).async_execute()
        await client.table("unit_modules").delete().eq("unit_id", unit_id).async_execute()

        module_rows: List[dict] = []
        topic_rows: List[dict] = []

        for module_index, module in enumerate(parsed_unit.get("modules") or []):
            module_response = (
                client.table("unit_modules")
                .insert(
                    {
                        "unit_id": unit_id,
                        "title": module.get("title") or f"Module {module_index + 1}",
                        "sort_order": module_index,
                        "metadata": module.get("metadata") or {},
                        "created_at": now,
                        "updated_at": now,
                    }
                )
                .async_execute()
            )
            if not module_response.data:
                continue
            module_row = module_response.data[0]
            module_rows.append(module_row)

            for topic_index, topic in enumerate(module.get("topics") or []):
                topic_response = (
                    client.table("unit_topics")
                    .insert(
                        {
                            "unit_id": unit_id,
                            "module_id": module_row["id"],
                            "title": topic.get("title") or f"Topic {topic_index + 1}",
                            "content_text": topic.get("content_text") or "",
                            "source_tables": topic.get("tables") or [],
                            "source_images": topic.get("images") or [],
                            "generation_status": "pending",
                            "sort_order": topic_index,
                            "metadata": topic.get("metadata") or {},
                            "created_at": now,
                            "updated_at": now,
                        }
                    )
                    .async_execute()
                )
                if topic_response.data:
                    topic_rows.append(topic_response.data[0])

        return {"modules": module_rows, "topics": topic_rows}

    async def get_topic(self, topic_id: str) -> Optional[dict]:
        return await self.db.fetch_one("unit_topics", {"id": topic_id})

    async def list_topics_for_unit(self, unit_id: str) -> List[dict]:
        try:
            response = (
                self.db.get_client()
                .table("unit_topics")
                .select("*")
                .eq("unit_id", unit_id)
                .order("sort_order", desc=False)
                .async_execute()
            )
            return response.data or []
        except Exception as exc:
            log.error("list_unit_topics_failed", unit_id=unit_id, error=str(exc))
            return []

    async def update_topic(self, topic_id: str, updates: Dict[str, Any]) -> Optional[dict]:
        updates = dict(updates)
        updates["updated_at"] = datetime.utcnow().isoformat()
        return await self.db.update("unit_topics", updates, {"id": topic_id})

    async def replace_generated_assets(self, unit_id: str, topic_id: str, assets: List[Dict[str, Any]]) -> List[dict]:
        client = self.db.get_client()
        now = datetime.utcnow().isoformat()
        await client.table("topic_assets").delete().eq("topic_id", topic_id).eq("is_generated", True).async_execute()

        inserted: List[dict] = []
        for asset in assets:
            response = (
                client.table("topic_assets")
                .insert(
                    {
                        "unit_id": unit_id,
                        "topic_id": topic_id,
                        "type": asset.get("type") or "note",
                        "title": asset.get("title") or "Generated Asset",
                        "file_url": asset.get("file_url"),
                        "is_generated": asset.get("is_generated", True),
                        "generation_status": asset.get("generation_status", "ready"),
                        "error_message": asset.get("error_message"),
                        "content_json": asset.get("content_json") or {},
                        "metadata": asset.get("metadata") or {},
                        "created_at": now,
                        "updated_at": now,
                    }
                )
                .async_execute()
            )
            if response.data:
                inserted.append(response.data[0])
        return inserted

    async def list_assets_for_unit(self, unit_id: str) -> List[dict]:
        try:
            response = (
                self.db.get_client()
                .table("topic_assets")
                .select("*")
                .eq("unit_id", unit_id)
                .order("created_at", desc=False)
                .async_execute()
            )
            return response.data or []
        except Exception as exc:
            log.error("list_unit_assets_failed", unit_id=unit_id, error=str(exc))
            return []

    async def build_unit_detail(self, unit_id: str) -> Optional[dict]:
        unit = await self.get_unit(unit_id)
        if not unit:
            return None

        modules = await self._list_modules(unit_id)
        topics = await self.list_topics_for_unit(unit_id)
        assets = await self.list_assets_for_unit(unit_id)
        jobs = await self.list_jobs_for_unit(unit_id)

        topics_by_module: Dict[str, List[dict]] = {}
        assets_by_topic: Dict[str, List[dict]] = {}

        for topic in topics:
            topic_copy = dict(topic)
            topic_copy["assets"] = []
            topics_by_module.setdefault(str(topic["module_id"]), []).append(topic_copy)

        for asset in assets:
            assets_by_topic.setdefault(str(asset["topic_id"]), []).append(asset)

        nested_modules: List[dict] = []
        for module in modules:
            module_topics = topics_by_module.get(str(module["id"]), [])
            for topic in module_topics:
                topic["assets"] = assets_by_topic.get(str(topic["id"]), [])
            module_copy = dict(module)
            module_copy["topics"] = module_topics
            nested_modules.append(module_copy)

        unit_detail = dict(unit)
        unit_detail["modules"] = nested_modules
        unit_detail["jobs"] = jobs
        return unit_detail

    async def finalize_unit_status(self, unit_id: str) -> Optional[dict]:
        topics = await self.list_topics_for_unit(unit_id)
        if not topics:
            return await self.update_unit(
                unit_id,
                {
                    "status": "ready",
                    "metadata": {"topicCount": 0, "readyTopicCount": 0, "failedTopicCount": 0},
                },
            )

        statuses = [topic.get("generation_status") or "pending" for topic in topics]
        if any(status in {"pending", "generating"} for status in statuses):
            return await self.update_unit(unit_id, {"status": "generating"})

        failed_topic_count = sum(1 for status in statuses if status == "failed")
        ready_topic_count = sum(1 for status in statuses if status == "ready")
        unit = await self.get_unit(unit_id) or {}
        metadata = dict(unit.get("metadata") or {})
        metadata.update(
            {
                "topicCount": len(topics),
                "readyTopicCount": ready_topic_count,
                "failedTopicCount": failed_topic_count,
            }
        )
        return await self.update_unit(unit_id, {"status": "ready", "metadata": metadata})

    async def _list_modules(self, unit_id: str) -> List[dict]:
        try:
            response = (
                self.db.get_client()
                .table("unit_modules")
                .select("*")
                .eq("unit_id", unit_id)
                .order("sort_order", desc=False)
                .async_execute()
            )
            return response.data or []
        except Exception as exc:
            log.error("list_unit_modules_failed", unit_id=unit_id, error=str(exc))
            return []
