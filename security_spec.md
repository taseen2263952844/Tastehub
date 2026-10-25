# TasteHub Restaurant - Security & Validation Architecture Specification

## 1. Zero-Trust Access Control & PII Protection
- **Customer Privacy:** In a production restaurant ordering system, orders contain sensitive customer PII (Full Name, Phone Number, Precise Home/Office Address, Order Habits).
- **Rule Enforcement:** `firestore.rules` enforces that `allow read` on the `/orders` collection is strictly restricted to `isAdmin()`. Anonymous public users and unauthenticated visitors cannot read or query the `/orders` collection.
- **Order Lookup:** To let a customer track their specific placed order in real-time without granting list access, the app uses an authoritative order lookup function or tracks the generated secure order ID locally during that user's session.
- **Status Immutability:** Once an order is created, regular users cannot update its status (e.g. from `pending` to `completed`) or modify the items or amounts. Status transitions are exclusively authorized to restaurant staff/administrators.

## 2. Server-Side Validation Requirements (Beyond Browser & Rules)
The browser client cannot be completely trusted for commercial integrity. While `firestore.rules` checks types, lengths, and non-negative numbers, a production deployment should incorporate a Firebase Cloud Function (or Cloudflare Worker / webhook) triggered on order creation:

1. **Authoritative Menu Price Verification:**
   - The server function fetches the current valid price of each `menuItemId` from `/menu_items` in Firestore.
   - It recalculates `subtotal = SUM(item.price * item.quantity)` and `total = subtotal + deliveryFee`.
   - If the incoming client-submitted total does not match the server-calculated sum, the order is immediately flagged or rejected for price tampering.

2. **Delivery Fee Calculation Guarantee:**
   - Verify that `orderType == 'pickup'` has `deliveryFee == 0`.
   - Verify that orders with `orderType == 'delivery'` apply the correct geographic delivery rate (e.g. ৳60 or free delivery threshold).

3. **Rate Limiting & Anti-Abuse (Sybil / DDoS Protection):**
   - Rate limit order creation per IP address or phone number (e.g., maximum 3 pending orders per phone number per hour) to prevent malicious bulk order creation without payment.
   - Implement SMS OTP (One-Time Password) verification for new phone numbers on Cash on Delivery (COD) to prevent fake address pranks.

4. **Kitchen Notification & Webhooks:**
   - Server-side trigger to sound kitchen thermal receipt printers or send WhatsApp/SMS order notifications to the TasteHub kitchen staff.

## 3. Administrative Authorization
- The designated restaurant administrator is bootstrapped as `bdtaseengaming@gmail.com` with `email_verified == true`.
- Additional managers can be provisioned by adding their Firebase Auth UID to the `/admins/{uid}` document.
