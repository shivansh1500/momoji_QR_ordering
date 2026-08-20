# Momoji QR-Based Restaurant Ordering System — Brain

This is the single source of truth for the project. Read this first before making any development decisions.

---

## 1. Project Purpose & Goals
Provide a seamless, contact-free restaurant ordering system for Momoji. Customers scan a table-specific QR code, view the menu, and place orders directly. Admins manage categories, items, tables, orders, settings, and view real-time operations and analytics.

---

## 2. Tech Stack
### Backend
- **Node.js** + **Express** + **JavaScript** (ES Modules)
- **MongoDB** + **Mongoose** (Database)
- **Socket.IO** (Real-time updates)
- **JWT Authentication** (Stored in `httpOnly`, `secure`, `sameSite=strict` cookie)
- **bcrypt** (Password hashing)
- **qrcode** (QR generation)
- **pdfkit** (PDF generation)
- **dotenv** (Env config)
- **cloudinary** (Cloud image storage)

### Frontend
- **React** (Vite + JavaScript + JSX)
- **Tailwind CSS** (Aether Design System Integration)
- **React Router** (v6)
- **Axios** (API client)
- **Socket.IO Client** (Real-time syncing)
- **react-window** / **react-virtuoso** (Virtualization)

---

## 3. Directory Structure
```
/project/QR_momoji_order_system
  ├── brain.md
  ├── package.json
  ├── backend/
  │   ├── src/
  │   │   ├── config/
  │   │   ├── models/
  │   │   ├── middleware/
  │   │   ├── controllers/
  │   │   ├── routes/
  │   │   ├── services/
  │   │   └── sockets/
  │   │   └── server.js
  │   ├── package.json
  │   └── .env
  └── frontend/
      ├── index.html
      ├── package.json
      ├── tailwind.config.js
      ├── vite.config.js
      └── src/
          ├── customer/
          ├── admin/
          ├── shared/
          ├── main.jsx
          └── routes.jsx
```

---

## 4. Core Domain & Business Rules
1. **Table-Based Sessions**: Sessions belong to *Tables*, not users/devices. There is no customer registration/login.
2. **Flexible Entry (QR-less Default)**:
   - Customers opening the site directly without a QR code are defaulted to Table 1 (or the first active table) for browsing.
   - If a valid `qrToken` is scanned/passed in the query param, the system resolves the custom table.
3. **Ordering Pipeline & Geofencing**:
   - Check if `Restaurant.isOpen` is true and current time is within operating hours.
   - Browsing is allowed without any location requests or geofence blocks.
   - **On checkout/submit order**, the browser requests the customer's GPS coordinates.
   - Run geofence validation (Haversine distance <= `radiusMeters`) only on order placement. If validation fails, block submission and inform the user.
   - If checks pass, look up/initialize the table session and place the order.
4. **Database Guardrails**:
   - Strict partial unique index on `{ tableId: 1, status: 1 }` where status = "ACTIVE".
   - Seamless sharing: if multiple customers scan the same table during an active session, orders accumulate on the *same* session. Do not show "table occupied".
4. **Order Lifecycle**:
   - `ORDERED` -> `ACCEPTED` -> `PAID` (Admin triggers).
   - `REJECTED` (Admin optional action from `ORDERED`).
   - Snapshot name and price on creation.
5. **Session Termination**:
   - Admin marks session as PAID -> `status` = "CLOSED", `closedAt` = now.
   - All historical order/session data is retained for analytics (never deleted).
   - Table immediately becomes available for a new session.

---

## 5. UI/UX Rules (Aether Convergence Theme)
- **Palette**:
  - Primary: `#B1E09D` (Light Green)
  - Secondary/Background: `#061C15` (Deep Forest Green)
  - Accent: `#82A89C` (Muted Slate Green)
  - Text Primary: `#111827`, Text Secondary: `#4B5563`
- **Typography**:
  - Headers: *Plus Jakarta Sans*
  - Body: *Playfair Display*
  - Data / IDs: *JetBrains Mono*
- **Layouts**:
  - Customer: Mobile-first, category chips, food item cards with virtual scrolling for large listings (>20 items), floating cart bar, and browser Geolocation dialog.
  - Admin: Desktop-first, sidebar, live orders columns, table status dashboard, settings controls.

---

## 6. Performance Requirements
- **Code-Splitting**: Code-split every top-level route with `React.lazy` + `Suspense`.
- **Virtualization**: Use `react-window` or `react-virtuoso` for any list that exceeds 20 items.
- **Caching & Indexes**: Ensure compound indexes are in place on MongoDB. Use `.lean()` for read queries.
- **Debouncing**: Debounce admin search and filters by 300ms.
