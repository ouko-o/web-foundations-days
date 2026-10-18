# TicketHub — Concert and Event Ticketing System Design

## 1. Requirements

### Functional requirements
- Users can register, log in, and browse or search concerts and events.
- Users can view event details, prices, and seat availability.
- Users can select seats and temporarily hold them while completing payment.
- Users can pay for an order and receive confirmed tickets.
- Users can view their orders and tickets.
- Expired holds and failed payments release seats for other customers.

### Non-functional requirements
- **Correctness:** A seat must never be sold to more than one customer. Booking operations must use strong consistency.
- **Speed:** Event browsing and seat-map viewing should normally respond within 2 seconds. Seat-hold requests should respond within 1 second when the system is not overloaded.
- **Fairness:** During a popular sale, a waiting room and controlled admission rate should give users a fair opportunity. Rate limits and bot checks should reduce automated abuse.
- **Availability:** Browsing should remain available during high demand. If booking capacity is reached, users should wait rather than risk incorrect bookings.
- **Security:** Users can only view and manage their own orders. Payment information should be handled by a trusted payment provider.
- **Scalability:** The system should support normal traffic and large, short-lived concert-sale spikes.

## 2. Traffic and Capacity Estimates

### Given information
- Registered users: 2,000,000
- Normal daily visitors: 50,000
- Pages viewed per visitor: 10
- Tickets sold on a normal day: 5,000
- Popular concert sale: 200,000 people competing for 20,000 seats in 10 minutes

Assume a day has 86,400 seconds. These are average estimates; actual traffic will be uneven, and the popular sale is the main capacity challenge.

### Normal traffic
- Page views per day: 50,000 × 10 = **500,000 page views**
- Average page views per second: 500,000 ÷ 86,400 = **about 5.8 requests/second**
- Average ticket sales: 5,000 ÷ 86,400 = **about 0.058 tickets/second**, or roughly 1 ticket every 17 seconds.

For a rough capacity target, allow for traffic being five times the daily average during busy periods:
- Normal busy browsing estimate: about **29 requests/second**
- Normal busy booking estimate: about **0.3 ticket sales/second**

### Popular concert sale
- People trying to buy: 200,000
- Seats available: 20,000
- Time window: 10 minutes = 600 seconds
- Average arrival rate: 200,000 ÷ 600 = **about 333 people/second**
- If all 20,000 seats sell during the 10 minutes: 20,000 ÷ 600 = **about 33 successful ticket sales/second**

The sale attracts 4 times the normal number of daily visitors, compressed into only 10 minutes. The system must also handle many more requests than successful sales because most customers will be competing for seats that may already be held or sold.

The design therefore uses caching for browsing, a waiting room to control admission, and a strongly consistent database for seat reservations.

## 3. API Design

Base URL: `/api/v1`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/events` | Browse and search events |
| GET | `/events/{eventId}` | View event details |
| GET | `/events/{eventId}/seats` | View seat map and availability |
| POST | `/holds` | Temporarily hold selected seats |
| POST | `/orders/{orderId}/payment` | Request payment for a held order |
| GET | `/users/me/tickets` | View the logged-in user's tickets |
| GET | `/orders/{orderId}` | View order status |

### Example: Hold seats

`POST /holds`

Request:
```json
{
  "eventId": 42,
  "seatIds": [ "A10", "A11" ]
}
```

Successful response (`201 Created`):
```json
{
  "orderId": 901,
  "status": "HELD",
  "seatIds": [ "A10", "A11" ],
  "expiresAt": "2026-10-18T17:10:00+03:00"
}
```

If another customer already holds or bought a requested seat, return `409 Conflict` and do not create a hold for those unavailable seats.

### Example: Payment

`POST /orders/901/payment`

Request:
```json
{
  "paymentToken": "token-from-payment-provider"
}
```

Response (`200 OK`):
```json
{
  "orderId": 901,
  "status": "CONFIRMED",
  "ticketIds": [ 7001, 7002 ]
}
```

Payment processing must use an idempotency key so that retrying a request does not charge the customer twice. The payment provider's confirmation is verified before the order becomes confirmed.

## 4. Data Model

The core database uses four tables: `users`, `events`, `seats`, and `orders`.

### users
- `id` — primary key
- `name` — customer's name
- `email` — unique login email
- `password_hash` — securely stored password hash
- `created_at` — account creation time

### events
- `id` — primary key
- `title` — concert or event name
- `venue` — event location
- `event_date` — date and time
- `status` — scheduled, on-sale, or completed

### seats
- `id` — primary key
- `event_id` — foreign key to `events.id`
- `seat_number` — seat label, such as A10
- `price` — ticket price
- `status` — available, held, or sold
- `hold_order_id` — nullable foreign key to `orders.id`
- `hold_expires_at` — nullable hold expiry time

A unique constraint on `(event_id, seat_number)` prevents duplicate seat records for the same event.

### orders
- `id` — primary key
- `user_id` — foreign key to `users.id`
- `event_id` — foreign key to `events.id`
- `status` — held, pending payment, confirmed, expired, or cancelled
- `total_amount` — order total
- `created_at` — order creation time
- `expires_at` — time the hold expires
- `payment_reference` — unique payment provider reference, when available

### Relationships
- One user can create many orders.
- One event has many seats.
- One event can have many orders.
- One order can hold or purchase multiple seats. Each seat points to its current hold order when held.

The database must enforce that a seat is held or sold by only one order at a time. Seat status and order status are updated together in a transaction.

## 5. Preventing Double-Booking

TicketHub uses a relational database transaction and a conditional update to reserve seats safely.

1. When a customer requests seats, the booking service starts a database transaction.
2. It checks that each requested seat belongs to the correct event and is available, or that its previous hold has expired.
3. It locks the requested seat rows using a row-level lock such as `SELECT ... FOR UPDATE`, in a consistent seat-ID order to reduce deadlocks.
4. It updates the seats to `HELD`, assigns the order ID, and sets a short expiry time. A database constraint or conditional update ensures a seat cannot be changed from an unavailable state into another active hold.
5. It creates the order and commits the transaction. If any requested seat cannot be held, the transaction rolls back so the customer does not receive a partial reservation.

When payment succeeds, a second transaction verifies that the order is still held and has not expired, changes the order to `CONFIRMED`, and changes the held seats to `SOLD`. If payment fails or the hold expires, the seats are released only if they still belong to that order.

**The key protection:** Two customers may request the same seat at nearly the same time, but the database serializes conflicting updates. Only one transaction can successfully claim the seat. The other receives a conflict response. The seat's unique event-and-seat constraint, row locks, conditional updates, and transaction boundaries protect against double-booking even when many requests arrive together.

Payment is handled outside the database transaction to avoid holding seat locks while waiting for a payment provider. A payment callback or reconciliation process handles delayed confirmations and refunds when a hold has expired.

## 6. Architecture

```text
                  Customers
                     |
                  DNS/CDN
                     |
             Virtual Waiting Room
                     |
              Load Balancer
                     |
          +----------+----------+
          |                     |
     App Server 1         App Server 2
          |                     |
          +----------+----------+
                     |
           +---------+---------+
           |                   |
      Cache (events)     Booking Service
                               |
                        Primary Database
                               |
                       Read Replica
                               |
                     Payment Provider
                               |
                    Queue + Background Worker
```

### Components
- **DNS/CDN:** Routes customers to TicketHub and caches static files such as images, CSS, and JavaScript.
- **Virtual waiting room:** Places users in a queue during a major sale and admits a controlled number of users at a time. It reduces overload and discourages unfair rapid refreshing.
- **Load balancer:** Distributes admitted requests across healthy application servers.
- **Application servers:** Handle login, event browsing, seat-map requests, and customer ticket pages. Multiple servers allow the system to continue if one fails.
- **Cache:** Stores event details and read-only seat-map snapshots for fast browsing. Seat availability in the cache is only informational; it is never the final authority for booking.
- **Booking service:** Applies the seat-hold and payment-confirmation rules and uses database transactions for reservation correctness.
- **Primary database:** Stores authoritative seat and order state. All booking writes go here to maintain strong consistency.
- **Read replica:** Serves suitable browsing and reporting queries. It may lag behind the primary, so it is not used to decide whether a seat can be sold.
- **Payment provider:** Processes payments securely and returns payment status. TicketHub verifies payment before confirming an order.
- **Queue and background worker:** Process hold expiry, payment notifications, ticket generation, and confirmation emails. Expiry jobs release seats only when the seat is still held by the expired order.

### GET /events flow
1. A customer requests the event list.
2. The CDN or cache serves static content and cached event data where possible.
3. The application server retrieves uncached event information from the database or read replica.
4. The response is returned to the customer.

### POST /holds flow
1. The waiting room admits the customer to the booking path.
2. The load balancer sends the request to an application server.
3. The booking service opens a transaction on the primary database.
4. Seat rows are locked and checked; available seats are held and an order is created.
5. The transaction commits, and the customer receives a hold expiry time.
6. The customer pays. A verified payment result confirms the order; otherwise the hold expires and seats are released.

### How it survives the big sale
The waiting room limits the number of simultaneous booking writes. Event details and seat-map snapshots are cached, keeping most browsing traffic away from the primary database. Application servers can scale horizontally. The primary database serializes conflicting seat reservations, while queues handle expiry and notifications asynchronously. If demand exceeds the safe booking rate, customers wait instead of allowing the database to accept unsafe or overloaded booking requests.

## 7. Trade-offs

1. **Fairness vs. speed:** A waiting room can make customers wait even when the site is online. It reduces overload and provides a more orderly sale, but adds complexity and may not perfectly eliminate bots.
2. **Consistency vs. availability:** Booking requests may briefly fail or wait when the primary database is under pressure. This is preferable to confirming the same seat for two customers. Event browsing can remain available using cached or replica data.
3. **Freshness vs. performance:** Cached seat maps can briefly show a seat as available after it has been held. The final hold request always checks the primary database, so a stale display cannot cause a double-sale.
4. **Payment reliability vs. simplicity:** Payment occurs outside the seat-locking transaction to avoid long database locks. This requires idempotency, callbacks, and reconciliation to handle delayed or duplicate payment notifications.

## Conclusion

TicketHub separates high-volume browsing from critical booking operations. Caching and a waiting room absorb the popular-sale traffic, while database transactions, row locks, conditional updates, and unique constraints ensure that each seat is sold to at most one customer.
