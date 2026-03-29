import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile

from app.routers.auth import get_current_user
from app.services.storage import storage_service
from app.store.unit_store import UnitStore
from app.worker import (
    task_generate_unit_presentation,
    task_generate_unit_topic_assets,
    task_process_unit_pdf,
)

router = APIRouter()
unit_store = UnitStore()


def _require_teacher(user: dict):
    if user.get("role") not in {"teacher", "faculty", "hod", "admin", "college_admin", "super_admin"}:
        raise HTTPException(status_code=403, detail="Teacher access required")


@router.post("/units/upload")
async def upload_unit_pdf(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
):
    _require_teacher(current_user)

    filename = file.filename or "unit.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF uploads are supported")

    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)

    unit_id = str(uuid.uuid4())
    safe_title = (title or Path(filename).stem.replace("_", " ").strip() or "Untitled Unit").strip()
    storage_url = storage_service.upload_file(file, f"units/{unit_id}/original.pdf")

    unit = await unit_store.create_unit(
        unit_id=unit_id,
        teacher_id=str(current_user["id"]),
        title=safe_title,
        original_filename=filename,
        source_file_url=storage_url,
        metadata={"fileSizeBytes": file_size},
    )
    if not unit:
        raise HTTPException(status_code=500, detail="Failed to create unit record")

    parse_job = await unit_store.create_processing_job(
        unit_id=unit_id,
        job_type="pdf_parse",
        status="queued",
        payload={"original_filename": filename, "storage_url": storage_url},
    )

    try:
        task_process_unit_pdf.delay(unit_id, parse_job["id"] if parse_job else None)
    except Exception as exc:
        await unit_store.update_unit(unit_id, {"status": "failed", "parse_error": str(exc)})
        raise HTTPException(status_code=503, detail="Background queue unavailable") from exc

    detail = await unit_store.build_unit_detail(unit_id)
    return {"unit": detail, "job": parse_job}


@router.get("/units")
async def list_teacher_units(current_user: dict = Depends(get_current_user)):
    _require_teacher(current_user)
    return await unit_store.list_units_for_teacher(str(current_user["id"]))


@router.get("/units/{unit_id}")
async def get_teacher_unit(unit_id: str, current_user: dict = Depends(get_current_user)):
    _require_teacher(current_user)
    unit = await unit_store.get_unit_for_teacher(unit_id, str(current_user["id"]))
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return await unit_store.build_unit_detail(unit_id)


@router.post("/units/{unit_id}/regenerate")
async def regenerate_unit_content(
    unit_id: str,
    topic_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    _require_teacher(current_user)
    unit = await unit_store.get_unit_for_teacher(unit_id, str(current_user["id"]))
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    if topic_id:
        topic = await unit_store.get_topic(topic_id)
        if not topic or str(topic.get("unit_id")) != unit_id:
            raise HTTPException(status_code=404, detail="Topic not found")
        await unit_store.update_topic(topic_id, {"generation_status": "pending", "generation_error": None})
        job = await unit_store.create_processing_job(
            unit_id=unit_id,
            topic_id=topic_id,
            job_type="topic_enrichment",
            status="queued",
        )
        task_generate_unit_topic_assets.delay(unit_id, topic_id, job["id"] if job else None)
        await unit_store.update_unit(unit_id, {"status": "generating"})
        return {"status": "queued", "job": job, "topic_id": topic_id}

    await unit_store.update_unit(unit_id, {"status": "parsing", "parse_error": None})
    job = await unit_store.create_processing_job(unit_id=unit_id, job_type="pdf_parse", status="queued")
    task_process_unit_pdf.delay(unit_id, job["id"] if job else None)
    return {"status": "queued", "job": job}


@router.post("/units/{unit_id}/generate-ppt")
async def generate_unit_ppt(unit_id: str, current_user: dict = Depends(get_current_user)):
    _require_teacher(current_user)
    unit = await unit_store.get_unit_for_teacher(unit_id, str(current_user["id"]))
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    job = await unit_store.create_processing_job(unit_id=unit_id, job_type="ppt_generation", status="queued")
    task_generate_unit_presentation.delay(unit_id, job["id"] if job else None)
    return {"status": "queued", "job": job}
