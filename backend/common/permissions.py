"""Permission helpers shared across apps."""


def is_internal_request(user) -> bool:
    return bool(getattr(user, "is_staff", False))
