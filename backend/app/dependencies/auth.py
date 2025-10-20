from typing import Annotated

from fastapi import Depends

from ..models import User


class CurrentUser(User):
    pass


async def get_current_user_mock() -> CurrentUser:
    user = CurrentUser()
    user.id = 1
    user.email = "demo@example.com"
    user.full_name = "Demo User"
    user.password_hash = "x"
    return user


CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user_mock)]



