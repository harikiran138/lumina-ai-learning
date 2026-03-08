from fastapi import APIRouter, Depends, HTTPException, Query

from app.services.personalization_service import get_personalization_service
from .auth import get_current_user

router = APIRouter()


@router.get("/profile")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    service = get_personalization_service()
    profile = await service.get_profile(current_user["id"], role=current_user.get("role", "student"))
    return profile.model_dump(mode="json")


@router.get("/profile/{user_id}")
async def get_profile_by_user_id(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in {"teacher", "admin"} and current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Not allowed to view another student's profile")

    service = get_personalization_service()
    profile = await service.get_profile(user_id)
    return profile.model_dump(mode="json")


@router.get("/interventions")
async def get_interventions(
    user_id: str = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") == "student":
        user_id = current_user["id"]
    elif user_id is None and current_user.get("role") in {"teacher", "admin"}:
        user_id = None
    elif current_user.get("role") not in {"teacher", "admin"}:
        raise HTTPException(status_code=403, detail="Not allowed to view intervention queue")

    service = get_personalization_service()
    interventions = await service.get_interventions(user_id=user_id)
    return [item.model_dump(mode="json") for item in interventions]
