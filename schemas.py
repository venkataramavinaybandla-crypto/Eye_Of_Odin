from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CategoryEnum(str, Enum):
    bag = "bag"
    electronics = "electronics"
    id_card = "id_card"
    bottle = "bottle"
    keys = "keys"
    clothing = "clothing"
    book = "book"
    other = "other"


class LocationZoneEnum(str, Enum):
    engineering_block = "Engineering Block"
    library = "Library"
    cafeteria = "Cafeteria"
    hostel_a = "Hostel A"
    hostel_b = "Hostel B"
    sports_complex = "Sports Complex"
    main_gate = "Main Gate"
    admin_block = "Admin Block"
    auditorium = "Auditorium"
    other = "Other"


class TypeEnum(str, Enum):
    lost = "lost"
    found = "found"


class StatusEnum(str, Enum):
    open = "open"
    resolved = "resolved"


class ReportCreate(BaseModel):
    category: CategoryEnum
    color: str
    location_zone: LocationZoneEnum
    description: Optional[str] = None
    type: TypeEnum
    timestamp: Optional[datetime] = None
    status: Optional[StatusEnum] = StatusEnum.open


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_path: Optional[str] = None
    category: str
    color: str
    location_zone: str
    timestamp: datetime
    description: Optional[str] = None
    type: str
    status: str
    embedding: Optional[str] = None
