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
import io
import csv
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from openpyxl import Workbook

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

class ProductCreate(BaseModel):
    name: str = Field(min_length=2)
    size_kg: int = Field(gt=0)
    price_mwk: int = Field(gt=0)
    description: str = ""
    badge: Optional[str] = None
    image: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    size_kg: Optional[int] = None
    price_mwk: Optional[int] = None
    description: Optional[str] = None
    badge: Optional[str] = None
    image: Optional[str] = None

class TrackQuery(BaseModel):
    phone: Optional[str] = None
    order_id: Optional[str] = None

# ---------------- Default Catalogue (seeded into DB on first run) ----------------
DEFAULT_PRODUCTS = [
    {
        "id": "rice-5kg",
        "name": "GLO Premium Rice — Family Pack",
        "size_kg": 5,
        "price_mwk": 8500,
        "description": "Cleaned, stone-free, honestly milled Malawian rice. Perfect for small households.",
        "badge": "Most popular",
        "image": None,
    },
    {
        "id": "rice-25kg",
        "name": "GLO Premium Rice — Household Bag",
        "size_kg": 25,
        "price_mwk": 38000,
        "description": "Branded 25kg bag of premium Malawian rice. Honest weight, full trust.",
        "badge": "Best value",
        "image": None,
    },
    {
        "id": "rice-50kg",
        "name": "GLO Premium Rice — Bulk Bag",
        "size_kg": 50,
        "price_mwk": 72000,
        "description": "Bulk 50kg bag for restaurants, chippy stands, mini-marts and large families.",
        "badge": "Bulk",
        "image": None,
    },
]

# ---------------- App ----------------
app = FastAPI(title="GLO Venture API")
api = APIRouter(prefix="/api")

@api.get("/")
async def root():
    return {"app": "GLO Venture", "status": "ok"}

@api.get("/products", response_model=List[Product])
async def list_products():
    cursor = db.products.find({}, {"_id": 0}).sort("price_mwk", 1)
    return await cursor.to_list(200)

@api.get("/track", response_model=List[OrderResponse])
async def track_order(phone: Optional[str] = None, order_id: Optional[str] = None):
    if not phone and not order_id:
        raise HTTPException(status_code=400, detail="Provide a phone number or order ID")
    query = {}
    if order_id:
        oid = order_id.strip()
        query = {"id": {"$regex": f"^{oid}", "$options": "i"}}
    elif phone:
        query = {"phone": phone.strip()}
    cursor = db.orders.find(query, {"_id": 0}).sort("created_at", -1)
    results = await cursor.to_list(50)
    if not results:
        raise HTTPException(status_code=404, detail="No orders found for this phone number or order ID")
    return results

@api.post("/admin/products", response_model=Product)
async def create_product(payload: ProductCreate, _: dict = Depends(get_current_admin)):
    doc = {
        "id": str(uuid.uuid4()),
        "name": payload.name.strip(),
        "size_kg": payload.size_kg,
        "price_mwk": payload.price_mwk,
        "description": payload.description.strip(),
        "badge": payload.badge,
        "image": payload.image,
    }
    await db.products.insert_one(doc.copy())
    return Product(**doc)

@api.put("/admin/products/{product_id}", response_model=Product)
async def update_product(product_id: str, payload: ProductUpdate, _: dict = Depends(get_current_admin)):
    updates = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = await db.products.find_one_and_update(
        {"id": product_id},
        {"$set": updates},
        return_document=True,
        projection={"_id": 0},
    )
    if not res:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**res)

@api.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, _: dict = Depends(get_current_admin)):
    res = await db.products.delete_one({"id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}

@api.post("/orders", response_model=OrderResponse)
async def create_order(payload: OrderCreate):
    enriched_items = []
    total = 0
    for item in payload.items:
        prod_doc = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not prod_doc:
            raise HTTPException(status_code=400, detail=f"Unknown product {item.product_id}")
        prod = Product(**prod_doc)
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

ORDER_REPORT_HEADERS = [
    "Order ID", "Customer Name", "Phone", "Location", "Address", "Items",
    "Total (MWK)", "Status", "Notes", "Created At",
]

def _order_row(o: dict) -> list:
    items_str = "; ".join(
        f"{it.get('quantity')} x {it.get('size_kg')}kg {it.get('name')}" for it in o.get("items", [])
    )
    return [
        o.get("id", ""),
        o.get("customer_name", ""),
        o.get("phone", ""),
        o.get("location", ""),
        o.get("address_details", ""),
        items_str,
        o.get("total_mwk", 0),
        o.get("status", ""),
        o.get("notes", ""),
        o.get("created_at", ""),
    ]

@api.get("/admin/orders/export")
async def export_orders(format: str = "csv", _: dict = Depends(get_current_admin)):
    fmt = (format or "csv").lower()
    if fmt not in {"csv", "xlsx"}:
        raise HTTPException(status_code=400, detail="format must be 'csv' or 'xlsx'")

    cursor = db.orders.find({}, {"_id": 0}).sort("created_at", -1)
    orders = await cursor.to_list(5000)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    if fmt == "csv":
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(ORDER_REPORT_HEADERS)
        for o in orders:
            writer.writerow(_order_row(o))
        buf.seek(0)
        filename = f"glo_venture_orders_{timestamp}.csv"
        return StreamingResponse(
            iter([buf.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    wb = Workbook()
    ws = wb.active
    ws.title = "Orders"
    ws.append(ORDER_REPORT_HEADERS)
    for o in orders:
        ws.append(_order_row(o))
    for col in ws.columns:
        max_len = max((len(str(c.value)) if c.value is not None else 0) for c in col)
        ws.column_dimensions[col[0].column_letter].width = min(max_len + 2, 50)
    out = io.BytesIO()
    wb.save(out)
    out.seek(0)
    filename = f"glo_venture_orders_{timestamp}.xlsx"
    return StreamingResponse(
        out,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

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
        await db.products.create_index("id", unique=True)
    except Exception as e:
        logger.warning(f"Index create skipped: {e}")

    # Seed products catalogue if empty
    product_count = await db.products.count_documents({})
    if product_count == 0:
        await db.products.insert_many([p.copy() for p in DEFAULT_PRODUCTS])
        logger.info(f"Seeded {len(DEFAULT_PRODUCTS)} default products")

@app.on_event("shutdown")
async def shutdown():
    client.close()
