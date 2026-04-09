# Backend Integration Summary

## ✅ Completed Integration

All frontend screens have been successfully integrated with the FastAPI backend.

### API Services Created

1. **`utils/apiClient.js`** - Centralized API client with:
   - Automatic JWT token injection
   - Error handling
   - Network error detection
   - 401 redirect to login

2. **`services/authApi.js`** - Authentication:
   - Login
   - Register (with CUSTOMER role auto-fetch)
   - Token refresh
   - Customer role ID helper

3. **`services/doctorsApi.js`** - Doctors CRUD operations

4. **`services/medicinesApi.js`** - Medicines/Products CRUD operations

5. **`services/ordersApi.js`** - Orders CRUD operations

6. **`services/appointmentsApi.js`** - Appointments CRUD operations

7. **`services/couponsApi.js`** - Coupons CRUD + validation

8. **`services/deliveryApi.js`** - Delivery settings (singleton)

9. **`services/usersApi.js`** - Users/Staff management

10. **`utils/dataMapper.js`** - Data format conversion between frontend/backend

### Screens Updated

✅ **Clinic.jsx** - Fetches doctors from backend
✅ **SpecialistDetail.jsx** - Fetches doctor details
✅ **Pharmacy.jsx** - Fetches medicines, therapeutic categories, delivery settings
✅ **Checkout.jsx** - Order creation, coupon validation
✅ **Profile.jsx** - User orders, doctors, products
✅ **Admin.jsx** - Full CRUD for all resources
✅ **CouponMarquee.jsx** - Active coupons display
✅ **CartContent.jsx** - Delivery settings
✅ **App.jsx** - Updated for coupon marquee visibility

### Key Features

- **Authentication**: JWT-based with automatic token handling
- **Error Handling**: Comprehensive error messages and network error detection
- **Loading States**: Loading indicators on all screens
- **Data Mapping**: Automatic conversion between frontend/backend formats
- **Real-time Updates**: Data refreshes after mutations

### API Endpoints Used

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Token refresh
- `GET /api/v1/roles/?search=CUSTOMER` - Get customer role
- `GET /api/v1/doctors/` - List doctors
- `GET /api/v1/medicines/` - List medicines
- `GET /api/v1/orders/` - List orders
- `GET /api/v1/appointments/` - List appointments
- `GET /api/v1/coupons/` - List coupons
- `POST /api/v1/coupons/validate` - Validate coupon
- `GET /api/v1/delivery-settings/` - Get delivery settings
- `GET /api/v1/therapeutic-categories/` - List therapeutic categories
- `GET /api/v1/users/` - List users/staff

### Data Format Notes

**Backend uses:**
- UUIDs for IDs
- `snake_case` for field names (e.g., `is_active`, `show_marquee`, `discount_percentage`)
- Separate entities (medicines vs medicine_brands, orders vs order_items)

**Frontend uses:**
- String/number IDs
- `camelCase` for field names (e.g., `isActive`, `showMarquee`, `discount`)
- Simplified structures

**Mapping functions in `utils/dataMapper.js` handle all conversions.**

### Important Notes

1. **Medicine/Product Structure**: Backend separates medicines and medicine_brands. Product creation in Admin may need additional setup for medicine_brand creation.

2. **Order Items**: Backend has separate order_items table. Current order creation creates the order only - order items may need separate API calls.

3. **Coupon Validation**: Requires `order_amount` parameter. Returns `discount_amount` in rupees (not percentage).

4. **Delivery Settings**: Singleton resource - use PATCH to update, POST to create if doesn't exist.

5. **Field Name Mapping**: 
   - `show_marquee` (backend) ↔ `showMarquee` (frontend)
   - `is_enabled` (backend) ↔ `isEnabled` (frontend)
   - `discount_percentage` (backend) ↔ `discount` (frontend)

### Environment Configuration

Set in `.env` or environment variables:
```
VITE_API_BASE_URL=http://localhost:8000
VITE_API_PREFIX=/api/v1
```

### Testing Checklist

- [ ] Login with valid credentials
- [ ] Register new user
- [ ] View doctors list
- [ ] View medicines/products
- [ ] Add items to cart
- [ ] Apply coupon code
- [ ] Create order
- [ ] View user orders in profile
- [ ] Admin: CRUD doctors
- [ ] Admin: CRUD medicines
- [ ] Admin: CRUD appointments
- [ ] Admin: CRUD coupons
- [ ] Admin: Update delivery settings

### Next Steps (Optional Enhancements)

1. **Order Items**: Implement order_items API integration for detailed order creation
2. **Medicine Brands**: Add medicine_brand creation when adding products
3. **Real-time Notifications**: WebSocket or polling for new orders
4. **Token Refresh**: Automatic token refresh on expiry
5. **Caching**: Add data caching to reduce API calls
6. **Error Boundaries**: React error boundaries for better error handling
7. **Optimistic Updates**: Update UI before API confirmation for better UX
