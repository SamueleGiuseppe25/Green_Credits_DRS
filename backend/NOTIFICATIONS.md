# Internal event-driven notifications

Lightweight in-process event bus used to trigger email confirmations. No RabbitMQ or Docker; can be swapped for a message broker later.

## Events and payloads

| Event | Where published | Payload |
|-------|-----------------|--------|
| `subscription.confirmed` | Subscription activation (router after `activate` / `choose_plan`); or from Stripe webhook when added | `email`, `plan_code`, `amount_eur`, `stripe_invoice_id?`, `ts` |
| `wallet.credit.created` | `wallet.credit_wallet_for_collection()` after a credit is committed | `email`, `amount_eur`, `proof_ref`, `new_balance_eur?`, `ts` |
| `wallet.debit.donated` | Wallet router after successful `POST /wallet/donate` | `email`, `amount_eur`, `proof_ref`, `new_balance_eur`, `ts` |
| `wallet.debit.redeemed` | Wallet router after successful `POST /wallet/redeem` | `email`, `amount_eur`, `proof_ref`, `new_balance_eur`, `ts` |

Handlers send dev-only “emails” (log + print). See `app/services/email_service.py` for TODO on real SMTP/SendGrid/Mailtrap.

## Replacing with RabbitMQ

1. In `app/core/events.py`, change `publish_event(event_name, payload)` so it:
   - Serializes `payload` (e.g. JSON) and publishes to a RabbitMQ exchange or queue (e.g. `notifications` topic with routing key `event_name`).
2. Run a separate consumer process that:
   - Subscribes to that queue, deserializes payloads, and calls the same notification logic (e.g. `_on_subscription_confirmed`, `_on_wallet_credit_created`, etc.) or reuses the same handler registration pattern.
3. Optionally keep `register_handler` for local/debug subscribers, or remove it and have only the consumer dispatch by event name.

## How to test quickly

1. Start the backend (e.g. `uvicorn app.main:app --reload`).
2. Log in and get a Bearer token, then:
   - **Donate:** `POST /wallet/donate` with body `{"amountCents": 100}`. Check console for `[EMAIL]` “Donation Confirmed” with proof reference.
   - **Redeem:** `POST /wallet/redeem` with body `{"amountCents": 50}`. Check console for “Redemption Confirmed”.
   - **Subscription:** `POST /subscriptions/activate`. Check console for “Subscription Confirmed”.
3. Wallet credit: triggered when `credit_wallet_for_collection()` is called (e.g. from collection completion flow). If that path is not yet used, no email is sent until that code path runs.
