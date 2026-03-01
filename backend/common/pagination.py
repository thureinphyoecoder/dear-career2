"""Simple pagination helpers."""


def paginate(items, page: int = 1, page_size: int = 20):
    start = max(page - 1, 0) * page_size
    end = start + page_size
    return items[start:end]
