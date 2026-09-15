from fastapi import APIRouter, HTTPException
from app.models.schemas import BusinessGoal
import uuid

router = APIRouter()

_goals_store: list[dict] = []


@router.get("", response_model=list[BusinessGoal])
async def get_goals():
    return _goals_store


@router.post("", response_model=BusinessGoal)
async def create_goal(title: str, description: str = "", deadline_days: int = 30, priority: str = "medium"):
    goal = BusinessGoal(
        goal_id=f"GOAL-{uuid.uuid4().hex[:8].upper()}",
        title=title,
        description=description,
        deadline_days=deadline_days,
        priority=priority,
        status="pending",
    )
    _goals_store.append(goal.model_dump())
    return goal


@router.put("/{goal_id}/status")
async def update_goal_status(goal_id: str, status: str):
    for g in _goals_store:
        if g["goal_id"] == goal_id:
            g["status"] = status
            return {"message": f"Goal {goal_id} updated to {status}"}
    raise HTTPException(status_code=404, detail="Goal not found")


@router.delete("/{goal_id}")
async def delete_goal(goal_id: str):
    global _goals_store
    before = len(_goals_store)
    _goals_store = [g for g in _goals_store if g["goal_id"] != goal_id]
    if len(_goals_store) < before:
        return {"message": f"Goal {goal_id} deleted"}
    raise HTTPException(status_code=404, detail="Goal not found")
