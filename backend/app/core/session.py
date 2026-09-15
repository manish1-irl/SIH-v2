from typing import Dict, Any, Optional

class SessionManager:
    """
    Centralized in-memory session manager for user conversational sessions and active business state.
    Provides cross-endpoint state synchronization between Chat, Feasibility Matrix,
    Scheme Calculator, Cluster Network, and Personal Dashboard.
    """
    _sessions: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def get_session(cls, user_id: str = "web-user") -> Dict[str, Any]:
        if not user_id:
            user_id = "web-user"
        if user_id not in cls._sessions:
            cls._sessions[user_id] = {
                "user_id": user_id,
                "context": {
                    "business_idea": "Commercial Mini Dairy & Chilling Unit",
                    "locality": "Bassi",
                    "state": "Rajasthan",
                    "capital": 100000.0,
                    "enterprise_name": "Ganga Enterprise",
                    "is_dpr_generated": False,
                    "is_dpr_confirmed": False,
                },
                "turns": [],
            }
        sess = cls._sessions[user_id]
        ctx = sess["context"]
        active = {
            "business_idea": ctx.get("business_idea", "Commercial Mini Dairy & Chilling Unit"),
            "locality": ctx.get("locality", "Bassi"),
            "state": ctx.get("state", "Rajasthan"),
            "capital": float(ctx.get("capital", 100000.0)),
            "enterprise_name": ctx.get("enterprise_name", f"{ctx.get('locality', 'Bassi')} Enterprise"),
            "is_dpr_generated": bool(ctx.get("is_dpr_generated", False)),
            "is_dpr_confirmed": bool(ctx.get("is_dpr_confirmed", False)),
        }
        sess["active_business"] = active
        return sess

    @classmethod
    def update_session(cls, user_id: str = "web-user", **kwargs) -> Dict[str, Any]:
        if not user_id:
            user_id = "web-user"
        session = cls.get_session(user_id)
        for k, v in kwargs.items():
            if v is not None:
                session["context"][k] = v
        session = cls.get_session(user_id)
        return session

    @classmethod
    def get_active_business(cls, user_id: str = "web-user") -> Dict[str, Any]:
        if not user_id:
            user_id = "web-user"
        session = cls.get_session(user_id)
        return session.get("active_business", {})

    @classmethod
    def clear_session(cls, user_id: str = "web-user") -> None:
        if not user_id:
            user_id = "web-user"
        if user_id in cls._sessions:
            del cls._sessions[user_id]

session_manager = SessionManager
