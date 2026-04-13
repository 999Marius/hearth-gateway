"""User CRUD routes."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


async def _user_by_username(db: AsyncSession, username: str) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalars().first()


async def _user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()


@router.get("", response_model=list[UserRead], dependencies=[Depends(require_admin)])
async def list_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[User]:
    """List users (admin only)."""
    result = await db.execute(select(User).offset(skip).limit(limit).order_by(User.id))
    return list(result.scalars().all())


@router.post(
    "",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Create user account (admin only)."""
    existing_username = await _user_by_username(db, payload.username.strip())
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        )

    existing_email = await _user_by_email(db, payload.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists",
        )

    user = User(
        username=payload.username.strip(),
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    """Get a user by ID (self or admin)."""
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if current_user.role != "admin" and current_user.id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return user


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    """Update user details (self or admin)."""
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    is_admin = current_user.role == "admin"
    if not is_admin and current_user.id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    data = payload.model_dump(exclude_unset=True)
    if not is_admin and any(field in data for field in ("role", "is_active")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can change role or active status",
        )

    new_username = data.get("username")
    if new_username and new_username != user.username:
        existing = await _user_by_username(db, new_username.strip())
        if existing and existing.id != user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already exists",
            )
        user.username = new_username.strip()

    new_email = data.get("email")
    if new_email and new_email != user.email:
        existing = await _user_by_email(db, new_email)
        if existing and existing.id != user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists",
            )
        user.email = new_email

    new_password = data.get("password")
    if new_password:
        user.hashed_password = get_password_hash(new_password)

    if "role" in data and data["role"] is not None:
        user.role = data["role"]

    if "is_active" in data and data["is_active"] is not None:
        user.is_active = data["is_active"]

    await db.flush()
    await db.refresh(user)
    return user


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict[str, str]:
    """Delete user account (admin only)."""
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin cannot delete self",
        )

    await db.delete(user)
    return {"message": "User deleted"}
