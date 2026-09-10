## Table `products`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `title` | `text` |  |
| `slug` | `text` |  Nullable Unique |
| `description` | `text` |  Nullable |
| `price` | `numeric` |  |
| `old_price` | `numeric` |  Nullable |
| `image_url` | `text` |  |
| `created_at` | `timestamptz` |  |
| `category_id` | `int8` |  Nullable |
| `available` | `bool` |  |
| `bestseller` | `bool` |  |

## Table `categories`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `name` | `text` |  Unique |
| `slug` | `text` |  Unique |
| `image_url` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `available` | `bool` |  |
| `home` | `bool` |  Nullable |

## Table `orders`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `first_name` | `text` |  |
| `last_name` | `text` |  |
| `email` | `text` |  |
| `phone` | `text` |  |
| `address` | `text` |  |
| `city` | `text` |  |
| `state` | `text` |  |
| `pin` | `text` |  |
| `country` | `text` |  |
| `notes` | `text` |  Nullable |
| `subtotal` | `numeric` |  |
| `shipping` | `numeric` |  |
| `total` | `numeric` |  |
| `payment_method` | `text` |  |
| `status` | `text` |  |
| `created_at` | `timestamptz` |  |
| `payment_error` | `text` |  Nullable |
| `razorpay_payment_id` | `text` |  Nullable |
| `payment_retry_count` | `int4` |  Nullable |
| `last_payment_attempt_at` | `timestamptz` |  Nullable |
| `user_id` | `uuid` |  Nullable |

## Table `order_items`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `order_id` | `int8` |  |
| `product_id` | `int8` |  Nullable |
| `slug` | `text` |  |
| `title` | `text` |  |
| `price` | `numeric` |  |
| `qty` | `int4` |  |
| `size` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `product_images`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `product_id` | `int8` |  |
| `image_url` | `text` |  |
| `sort_order` | `int4` |  |
| `created_at` | `timestamptz` |  |

## Table `customers`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `first_name` | `text` |  |
| `last_name` | `text` |  |
| `email` | `text` |  Unique |
| `phone` | `text` |  |
| `address` | `text` |  |
| `city` | `text` |  |
| `state` | `text` |  |
| `pin` | `text` |  |
| `country` | `text` |  |
| `total_orders` | `int4` |  |
| `total_spent` | `numeric` |  |
| `last_order_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `payment_attempts`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `order_id` | `int8` |  |
| `attempt_number` | `int4` |  |
| `status` | `text` |  |
| `error_message` | `text` |  Nullable |
| `razorpay_payment_id` | `text` |  Nullable |
| `razorpay_order_id` | `text` |  Nullable |
| `payment_response` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `contact_submissions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `name` | `text` |  |
| `email` | `text` |  |
| `phone` | `text` |  Nullable |
| `message` | `text` |  |
| `created_at` | `timestamptz` |  |

## Table `special_inquiries`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `email` | `text` |  |
| `phone` | `text` |  Nullable |
| `message` | `text` |  |
| `inquiry_type` | `text` |  |
| `created_at` | `timestamptz` |  |

## Table `users_legacy`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `email` | `text` |  Unique |
| `phone` | `text` |  |
| `password` | `text` |  |
| `first_name` | `text` |  Nullable |
| `last_name` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `email` | `text` |  |
| `phone` | `text` |  Nullable |
| `first_name` | `text` |  Nullable |
| `last_name` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## RLS Policies

### `products`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Public read access` | SELECT | public | PERMISSIVE | `true` | — |
| `Public can read available products` | SELECT | public | PERMISSIVE | `(available = true)` | — |

### `orders`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `allow anon insert orders` | INSERT | anon | PERMISSIVE | — | `true` |
| `users read own orders` | SELECT | authenticated | PERMISSIVE | `(email = (auth.jwt() ->> 'email'::text))` | — |
| `allow anon select orders` | SELECT | anon | PERMISSIVE | `true` | — |
| `allow anon update own orders` | UPDATE | anon | PERMISSIVE | `(status = ANY (ARRAY['payment_pending'::text, 'pending'::text]))` | `(status = ANY (ARRAY['confirmed'::text, 'cancelled'::text]))` |
| `Anyone can create an order` | INSERT | public | PERMISSIVE | — | `true` |
| `Order owner can read own order` | SELECT | public | PERMISSIVE | `true` | — |
| `Anyone can update order status` | UPDATE | public | PERMISSIVE | `true` | — |
| `orders: read own` | SELECT | public | PERMISSIVE | `((auth.uid() = user_id) OR (user_id IS NULL))` | — |

### `order_items`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `allow anon insert order_items` | INSERT | anon | PERMISSIVE | — | `true` |
| `users read own order_items` | SELECT | authenticated | PERMISSIVE | `(order_id IN ( SELECT orders.id    FROM orders   WHERE (orders.email = (auth.jwt() ->> 'email'::text))))` | — |
| `allow anon select order_items` | SELECT | anon | PERMISSIVE | `true` | — |
| `Anyone can add order items` | INSERT | public | PERMISSIVE | — | `true` |
| `Order items readable by anyone who knows the order_id` | SELECT | public | PERMISSIVE | `true` | — |

### `product_images`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Public can read product images` | SELECT | public | PERMISSIVE | `(EXISTS ( SELECT 1    FROM products   WHERE ((products.id = product_images.product_id) AND (products.available = true))))` | — |

### `categories`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Public read categories` | SELECT | anon, authenticated | PERMISSIVE | `true` | — |
| `Public can read available categories` | SELECT | public | PERMISSIVE | `(available = true)` | — |

### `payment_attempts`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Anyone can insert payment attempt` | INSERT | public | PERMISSIVE | — | `true` |
| `Anyone can update payment attempt` | UPDATE | public | PERMISSIVE | `true` | — |

### `users_legacy`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `anon insert users` | INSERT | anon | PERMISSIVE | — | `true` |
| `anon select users` | SELECT | anon | PERMISSIVE | `true` | — |
| `anon update users` | UPDATE | anon | PERMISSIVE | `true` | — |

### `profiles`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `profiles: read own` | SELECT | public | PERMISSIVE | `(auth.uid() = id)` | — |
| `profiles: update own` | UPDATE | public | PERMISSIVE | `(auth.uid() = id)` | — |

