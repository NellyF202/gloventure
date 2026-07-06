from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ---------------- Mongo ----------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ---------------- Auth helpers ----------------
JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@gloventure.mw")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "GloVenture2026!")

def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(p: str, h: str) -> bool:
    return bcrypt.checkpw(p.encode("utf-8"), h.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

bearer_scheme = HTTPBearer(auto_error=False)

async def get_current_admin(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    token = None
    if creds and creds.credentials:
        token = creds.credentials
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=401, detail="User not found")
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ---------------- Models ----------------
class Product(BaseModel):
    id: str
    name: str
    size_kg: int
    price_mwk: int
    description: str
    badge: Optional[str] = None
    image: Optional[str] = None

class OrderItem(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)

class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2)
    phone: str = Field(min_length=6)
    location: str  # "Dowa" | "Dzaleka" | other
    address_details: str
    items: List[OrderItem]
    notes: Optional[str] = ""
    delivery_method: Optional[str] = "motorbike"

class OrderResponse(BaseModel):
    id: str
    customer_name: str
    phone: str
    location: str
    address_details: str
    items: List[dict]
    total_mwk: int
    notes: Optional[str] = ""
    status: str
    created_at: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class OrderStatusUpdate(BaseModel):
    status: str  # pending | confirmed | out_for_delivery | delivered | cancelled

# ---------------- Hardcoded Catalogue ----------------
PRODUCTS: List[Product] = [
    Product(
        id="rice-5kg",
        name="GLO Premium Rice — Family Pack",
        size_kg=5,
        price_mwk=8500,
        description="Cleaned, stone-free, honestly milled Malawian rice. Perfect for small households.",
        badge="Most popular",
    ),
    Product(
        id="rice-25kg",
        name="GLO Premium Rice — Household Bag",
        size_kg=25,
        price_mwk=38000,
        description="Branded 25kg bag of premium Malawian rice. Honest weight, full trust.",
        badge="Best value",
    ),
    Product(
        id="rice-50kg",
        name="GLO Premium Rice — Bulk Bag",
        size_kg=50,
        price_mwk=72000,
        description="Bulk 50kg bag for restaurants, chippy stands, mini-marts and large families.",
        badge="Bulk",
    ),
]
PRODUCT_MAP = {p.id: p for p in PRODUCTS}

# ---------------- App ----------------
app = FastAPI(title="GLO Venture API")
api = APIRouter(prefix="/api")

@api.get("/")
async def root():
    return {"app": "GLO Venture", "status": "ok"}

@api.get("/products", response_model=List[Product])
async def list_products():
    return PRODUCTS

@api.post("/orders", response_model=OrderResponse)
async def create_order(payload: OrderCreate):
    enriched_items = []
    total = 0
    for item in payload.items:
        prod = PRODUCT_MAP.get(item.product_id)
        if not prod:
            raise HTTPException(status_code=400, detail=f"Unknown product {item.product_id}")
        line_total = prod.price_mwk * item.quantity
        total += line_total
        enriched_items.append({
            "product_id": prod.id,
            "name": prod.name,
            "size_kg": prod.size_kg,
            "unit_price_mwk": prod.price_mwk,
            "quantity": item.quantity,
            "line_total_mwk": line_total,
        })
    if not enriched_items:
        raise HTTPException(status_code=400, detail="No items in order")

    order_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": order_id,
        "customer_name": payload.customer_name.strip(),
        "phone": payload.phone.strip(),
        "location": payload.location,
        "address_details": payload.address_details.strip(),
        "items": enriched_items,
        "total_mwk": total,
        "notes": (payload.notes or "").strip(),
        "delivery_method": payload.delivery_method or "motorbike",
        "status": "pending",
        "created_at": now_iso,
    }
    await db.orders.insert_one(doc.copy())
    return OrderResponse(**doc)

@api.get("/orders", response_model=List[OrderResponse])
async def list_orders(_: dict = Depends(get_current_admin)):
    cursor = db.orders.find({}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(500)

@api.patch("/orders/{order_id}", response_model=OrderResponse)
async def update_order_status(order_id: str, payload: OrderStatusUpdate, _: dict = Depends(get_current_admin)):
    allowed = {"pending", "confirmed", "out_for_delivery", "delivered", "cancelled"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status")
    res = await db.orders.find_one_and_update(
        {"id": order_id},
        {"$set": {"status": payload.status}},
        return_document=True,
        projection={"_id": 0},
    )
    if not res:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse(**res)

@api.post("/admin/login")
async def admin_login(payload: AdminLogin):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not an admin")
    token = create_access_token(user["id"], email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user["id"], "email": email, "role": "admin"},
    }

@api.get("/admin/me")
async def admin_me(current: dict = Depends(get_current_admin)):
    return {"id": current["id"], "email": current["email"], "role": current["role"]}

@api.get("/admin/stats")
async def admin_stats(_: dict = Depends(get_current_admin)):
    total = await db.orders.count_documents({})
    pending = await db.orders.count_documents({"status": "pending"})
    delivered = await db.orders.count_documents({"status": "delivered"})
    pipe = [{"$group": {"_id": None, "rev": {"$sum": "$total_mwk"}}}]
    rev = 0
    async for d in db.orders.aggregate(pipe):
        rev = d.get("rev", 0)
    return {"total_orders": total, "pending": pending, "delivered": delivered, "revenue_mwk": rev}

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    # Seed admin
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin user {ADMIN_EMAIL}")
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.users.update_one(
            {"email": ADMIN_EMAIL},
            {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}},
        )
        logger.info(f"Updated admin password for {ADMIN_EMAIL}")
    try:
        await db.users.create_index("email", unique=True)
        await db.orders.create_index("created_at")
    except Exception as e:
        logger.warning(f"Index create skipped: {e}")

@app.on_event("shutdown")
async def shutdown():
    client.close()
