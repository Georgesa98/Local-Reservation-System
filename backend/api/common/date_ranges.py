from datetime import date, timedelta
from typing import Iterable


def expand_date_range(start_date: date, end_date: date) -> list[date]:
    if end_date <= start_date:
        return []

    dates: list[date] = []
    current_date = start_date
    while current_date < end_date:
        dates.append(current_date)
        current_date += timedelta(days=1)

    return dates


def expand_date_ranges(date_ranges: Iterable[tuple[date, date]]) -> list[date]:
    blocked_dates = set()

    for start_date, end_date in date_ranges:
        blocked_dates.update(expand_date_range(start_date, end_date))

    return sorted(blocked_dates)