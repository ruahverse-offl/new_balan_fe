# Admin sections → Backend mapping

How each Admin section (Inventory, Product Batches, Medicine Categories, Manage Medicines, Therapeutic Categories) maps to backend APIs, routes, and database.

---

## 1. Inventory (Admin tab: **Inventory**)

| Layer | Detail |
|-------|--------|
| **Admin tab id** | `inventory` |
| **Frontend service** | `src/services/inventoryTransactionsApi.js` |
| **API path (base: `/api/v1`)** | `GET/POST /inventory-transactions`, `GET/PATCH/DELETE /inventory-transactions/{id}`, `GET /inventory-transactions/{id}/detail` |
| **Backend router** | `app/routes/inventory_transactions_router.py` |
| **Backend prefix** | `/api/v1/inventory-transactions` |
| **Backend service** | `app/services/inventory_transactions_service.py` |
| **Backend repository** | `app/repositories/inventory_transactions_repository.py` |
| **DB table** | `inventory_transactions` |
| **DB model** | `InventoryTransaction` in `app/db/models.py` |

**What it does:** Stock in/out (PURCHASE, SALE, etc.). Each row has `medicine_brand_id`, `product_batch_id`, `transaction_type`, `quantity_change`, optional `reference_order_id` for sales. Admin can filter by medicine brand and list/add/edit/delete transactions.

---

## 2. Product Batches (Admin tab: **Product Batches**)

| Layer | Detail |
|-------|--------|
| **Admin tab id** | `batches` |
| **Frontend service** | `src/services/batchesApi.js` |
| **API path** | `GET/POST /product-batches`, `GET/PATCH/DELETE /product-batches/{id}`, `GET /product-batches/{id}/detail` |
| **Backend router** | `app/routes/product_batches_router.py` |
| **Backend prefix** | `/api/v1/product-batches` |
| **Backend service** | `app/services/product_batches_service.py` |
| **Backend repository** | `app/repositories/product_batches_repository.py` |
| **DB table** | `product_batches` |
| **DB model** | `ProductBatch` |

**What it does:** Batches of a medicine brand (batch number, expiry date, purchase price, quantity). Linked to `medicine_brands`. Detail endpoint returns batch + related inventory transactions + order items.

---

## 3. Medicine Categories (Admin tab: **Medicine Categories**)

| Layer | Detail |
|-------|--------|
| **Admin tab id** | `categories` |
| **Frontend service** | `src/services/categoriesApi.js` |
| **API path** | `GET/POST /product-categories`, `GET/PATCH/DELETE /product-categories/{id}` |
| **Backend router** | `app/routes/product_categories_router.py` |
| **Backend prefix** | `/api/v1/product-categories` |
| **Backend service** | `app/services/product_categories_service.py` |
| **Backend repository** | `app/repositories/product_categories_repository.py` |
| **DB table** | `product_categories` |
| **DB model** | `ProductCategory` |

**What it does:** Product categories (e.g. OTC, Prescription) by name. Used for grouping products; Admin manages list and add/edit/delete by name.

---

## 4. Manage Medicines (Admin tab: **Manage Medicines**)

| Layer | Detail |
|-------|--------|
| **Admin tab id** | `medicines` |
| **Frontend services** | `medicinesApi.js`, `brandsApi.js`, `compositionsApi.js` (used from same tab / related tabs) |
| **API paths** | See below |
| **DB tables** | `medicines`, `medicine_brands`, `medicine_compositions` |

### 4a. Medicines (generic product)

| Layer | Detail |
|-------|--------|
| **Frontend** | `getMedicines`, `createMedicine`, `updateMedicine`, `deleteMedicine` in `medicinesApi.js` |
| **API path** | `GET/POST /medicines`, `GET/PATCH/DELETE /medicines/{id}` |
| **Backend router** | `app/routes/medicines_router.py` → `/api/v1/medicines` |
| **Backend service** | `app/services/medicines_service.py` |
| **DB table** | `medicines` |
| **DB model** | `Medicine` |

**Fields:** name, therapeutic_category_id, dosage_form, schedule_type, is_controlled, description.

### 4b. Medicine Brands (used in Manage Medicines / Brands tab)

| Layer | Detail |
|-------|--------|
| **Frontend** | `brandsApi.js` → `getBrands`, `createBrand`, `updateBrand`, `deleteBrand` |
| **API path** | `GET/POST /medicine-brands`, `GET/PATCH/DELETE /medicine-brands/{id}` |
| **Backend router** | `app/routes/medicine_brands_router.py` → `/api/v1/medicine-brands` |
| **DB table** | `medicine_brands` |
| **DB model** | `MedicineBrand` |

**Fields:** brand_name, manufacturer, mrp, medicine_id (FK to medicines), description. One medicine can have many brands.

### 4c. Medicine Compositions (Compositions tab)

| Layer | Detail |
|-------|--------|
| **Frontend** | `compositionsApi.js` |
| **API path** | `GET/POST /medicine-compositions`, `GET/PATCH/DELETE /medicine-compositions/{id}` |
| **Backend router** | `app/routes/medicine_compositions_router.py` → `/api/v1/medicine-compositions` |
| **DB table** | `medicine_compositions` |
| **DB model** | `MedicineComposition` |

**Fields:** medicine_id, salt_name, strength, unit. One medicine can have many compositions (salts).

**Summary:** “Manage Medicines” in Admin is mainly the **medicines** list (generic products). Related data: **Medicine Brands** and **Compositions** use their own APIs and tables but are part of the same product hierarchy.

---

## 5. Therapeutic Categories (Admin tab: **Therapeutic Cat.**)

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
| Inventory               | `/inventory-transactions`           | `inventory_transactions_router`      | `inventory_transactions` |
| Product Batches         | `/product-batches`                  | `product_batches_router`            | `product_batches`       |
| Medicine Categories     | `/product-categories`              | `product_categories_router`        | `product_categories`     |
| Manage Medicines        | `/medicines`                        | `medicines_router`                  | `medicines`              |
| (Medicine) Brands       | `/medicine-brands`                  | `medicine_brands_router`            | `medicine_brands`        |
| Compositions            | `/medicine-compositions`            | `medicine_compositions_router`      | `medicine_compositions`  |
| Therapeutic Cat.        | `/therapeutic-categories`          | `therapeutic_categories_router`    | `therapeutic_categories` |

All frontend calls go through `apiClient` with `VITE_API_BASE_URL` + `VITE_API_PREFIX` (e.g. `http://localhost:8000/api/v1`).
