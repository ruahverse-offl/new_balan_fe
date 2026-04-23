# Admin sections → Backend mapping

How each Admin section (Manage Medicines, Therapeutic Categories, etc.) maps to backend APIs, routes, and database.

The standalone **Inventory** admin tab and `/api/v1/inventory-transactions` CRUD API were removed. The `inventory_transactions` table is still written internally when orders are approved (stock decrements / SALE rows) and batch detail still shows transaction history.

**Product batches:** The **Product Batches** admin tab and `/api/v1/product-batches` API were removed. The `product_batches` table and `ProductBatch` model remain for internal order fulfilment (FEFO allocation, `order_items.product_batch_id`).

**RBAC & sidebar:** After login, the app calls **`GET /api/v1/auth/me/permissions`** (`authApi.getUserPermissions` / `usersApi.getCurrentUser`). The response includes **`permissions`** (synthetic legacy codes), **`role_code`**, **`role_display_name`**, **`menu_items`** (each with **`display_order`**, `display_name`, `icon_key`, `code`), **`menu_keys`**, and **`menu_order`** (parallel `display_order` values). Tab order in Admin follows **`display_order`** from `M_modules`. The Statistics/KPI dashboard API was removed.

---

## 1. Manage Medicines (Admin tab: **Manage Medicines**)

| Layer | Detail |
|-------|--------|
| **Admin tab id** | `medicines` |
| **Frontend services** | `medicinesApi.js`, `brandsApi.js` (related tabs) |
| **API paths** | See below |
| **DB tables** | `medicines`, `medicine_brands` (legacy `medicine_compositions` table may still exist in DB; no public CRUD API) |

### 1a. Medicines (generic product)

| Layer | Detail |
|-------|--------|
| **Frontend** | `getMedicines`, `createMedicine`, `updateMedicine`, `deleteMedicine` in `medicinesApi.js` |
| **API path** | `GET/POST /medicines`, `GET/PATCH/DELETE /medicines/{id}` |
| **Backend router** | `app/routes/medicines_router.py` → `/api/v1/medicines` |
| **Backend service** | `app/services/medicines_service.py` |
| **DB table** | `medicines` |
| **DB model** | `Medicine` |

**Fields:** name, therapeutic_category_id, dosage_form, schedule_type, is_controlled, description.

### 1b. Medicine Brands (nested on medicines; staff mutations only on `/medicine-brands`)

| Layer | Detail |
|-------|--------|
| **Frontend** | `brandsApi.js` → `getBrands` (flattened from `GET /medicines?include_brands=true`), `createBrand` / `updateBrand` / `deleteBrand` for staff flows where needed |
| **API path** | **Read:** `GET /medicines?include_brands=true`, `GET /medicines/{id}?include_brands=true` — **Write:** `POST/PATCH/DELETE /medicine-brands` (no public list GET on `/medicine-brands`) |
| **Backend routers** | `medicines_router` (nested brands), `medicine_brands_router` (mutations only) |
| **DB table** | `medicine_brands` |
| **DB model** | `MedicineBrand` |

**Fields:** brand_name, manufacturer, mrp, medicine_id (FK to medicines), description. One medicine can have many brands.

**Summary:** “Manage Medicines” in Admin is mainly the **medicines** list (generic products). **Brands** are nested on medicine responses when `include_brands=true`; the dedicated **Medicine Brands** admin tab was removed. The **Compositions** admin tab and `/medicine-compositions` API were removed.

---

## 2. Therapeutic Categories (Admin tab: **Therapeutic Cat.**)

| Layer | Detail |
|-------|--------|
| **Admin tab id** | `therapeutic-categories` |
| **Frontend service** | `src/services/therapeuticCategoriesApi.js` |
| **API path** | `GET/POST /therapeutic-categories`, `GET/PATCH/DELETE /therapeutic-categories/{id}` |
| **Backend router** | `app/routes/therapeutic_categories_router.py` |
| **Backend prefix** | `/api/v1/therapeutic-categories` |
| **Backend service** | `app/services/therapeutic_categories_service.py` |
| **Backend repository** | `app/repositories/therapeutic_categories_repository.py` |
| **DB table** | `therapeutic_categories` |
| **DB model** | `TherapeuticCategory` |

**What it does:** Therapeutic categories (e.g. by condition/use). Each **Medicine** has a `therapeutic_category_id` FK. Admin list/add/edit/delete therapeutic categories; Manage Medicines uses them in the therapeutic category dropdown.

---

## Quick reference: Admin tab → API path → DB table

| Admin section           | Frontend API path (under `/api/v1`) | Backend router                      | DB table                 |
|-------------------------|-------------------------------------|-------------------------------------|--------------------------|
| Manage Medicines        | `/medicines`                        | `medicines_router`                  | `medicines`              |
| Brands (reads)          | `/medicines?include_brands=true`    | `medicines_router`                  | `medicine_brands`        |
| Brands (writes)         | `/medicine-brands` (POST/PATCH/DEL) | `medicine_brands_router`            | `medicine_brands`        |
| Therapeutic Cat.        | `/therapeutic-categories`          | `therapeutic_categories_router`    | `therapeutic_categories` |

All frontend calls go through `apiClient` with `VITE_API_BASE_URL` + `VITE_API_PREFIX` (e.g. `http://localhost:8000/api/v1`).
