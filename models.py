from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Locked categories and location zones for reference / validation
LOCKED_CATEGORIES = [
    "bag", "electronics", "id_card", "bottle", "keys", "clothing", "book", "other"
]

LOCKED_LOCATION_ZONES = [
    "Engineering Block", "Library", "Cafeteria", "Hostel A", "Hostel B",
    "Sports Complex", "Main Gate", "Admin Block", "Auditorium", "Other"
]

LOCKED_TYPES = ["lost", "found"]
LOCKED_STATUSES = ["open", "resolved"]


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    image_path = Column(String, nullable=True)
    category = Column(String, nullable=False)
    color = Column(String, nullable=False)
    location_zone = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String, nullable=False)
    status = Column(String, default="open", nullable=False)
    embedding = Column(Text, nullable=True)
