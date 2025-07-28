import { type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// Discount tiers configuration
const DISCOUNT_TIERS = [
  { min: 20000, percent: 20, code: "LIFETIME_20" },
  { min: 5000, percent: 15, code: "LIFETIME_15" },
  { min: 3500, percent: 12, code: "LIFETIME_12" },
  { min: 2500, percent: 10, code: "LIFETIME_10" },
];

// Cache for customer lifetime values
const customerCache = new Map<string, { value: number; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(identifier) || [];

  // Clean old requests
  const validRequests = requests.filter(
    (time) => now - time < RATE_LIMIT_WINDOW
  );

  if (validRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  validRequests.push(now);
  rateLimitMap.set(identifier, validRequests);
  return false;
}

function validateInput(data: any): { valid: boolean; error?: string } {
  if (typeof data.cartTotal !== "number" || data.cartTotal < 0) {
    return { valid: false, error: "Invalid cart total" };
  }

  if (data.customerId && typeof data.customerId !== "string") {
    return { valid: false, error: "Invalid customer ID format" };
  }

  if (data.sessionId && typeof data.sessionId !== "string") {
    return { valid: false, error: "Invalid session ID" };
  }

  return { valid: true };
}

async function getCustomerLifetimeValue(
  admin: any,
  customerId: string
): Promise<number> {
  // Check cache first
  const cached = customerCache.get(customerId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  try {
    const query = `
      query getCustomerLifetimeValue($id: ID!) {
        customer(id: $id) {
          id
          metafield(namespace: "lifetime_value", key: "total_spent") {
            value
          }
          orders(first: 250, sortKey: TOTAL_PRICE) {
            edges {
              node {
                totalPriceSet {
                  shopMoney {
                    amount
                  }
                }
                financialStatus
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(query, {
      variables: {
        id: `gid://shopify/Customer/${customerId}`,
      },
    });

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    // Get lifetime value from metafield or calculate from orders
    let lifetimeSpent = parseFloat(
      data.data?.customer?.metafield?.value || "0"
    );

    // Fallback: calculate from actual orders if metafield is missing
    if (!lifetimeSpent && data.data?.customer?.orders?.edges) {
      lifetimeSpent = data.data.customer.orders.edges
        .filter((edge: any) => edge.node.financialStatus === "PAID")
        .reduce((sum: number, edge: any) => {
          return sum + parseFloat(edge.node.totalPriceSet.shopMoney.amount);
        }, 0);
    }

    // Update cache
    customerCache.set(customerId, {
      value: lifetimeSpent,
      timestamp: Date.now(),
    });

    return lifetimeSpent;
  } catch (error) {
    console.error("Error fetching customer lifetime value:", error);
    throw error;
  }
}

export async function action({ request }: ActionFunctionArgs) {
  // Handle both POST and GET for app proxy compatibility
  if (request.method === "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Authenticate the request
    const { admin } = await authenticate.public.appProxy(request);

    // Get request data
    const requestData = await request.json();

    // Validate input
    const validation = validateInput(requestData);
    if (!validation.valid) {
      return Response.json(
        {
          discountPercent: 0,
          discountCode: null,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    const { cartTotal, customerId, sessionId } = requestData;

    // Rate limiting by session or IP
    const rateLimitKey =
      sessionId || request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(rateLimitKey)) {
      return Response.json(
        {
          discountPercent: 0,
          discountCode: null,
          error: "Rate limit exceeded",
        },
        { status: 429 }
      );
    }

    // If no customer ID, no discount
    if (!customerId) {
      return Response.json({
        discountPercent: 0,
        discountCode: null,
        message: "Login to unlock lifetime value discounts",
      });
    }

    // Validate customer ID format
    if (!customerId.match(/^\d+$/)) {
      return Response.json(
        {
          discountPercent: 0,
          discountCode: null,
          error: "Invalid customer ID",
        },
        { status: 400 }
      );
    }

    // Get customer's lifetime spent
    const lifetimeSpent = await getCustomerLifetimeValue(admin, customerId);

    // Calculate total value (lifetime + current cart)
    const totalValue = lifetimeSpent + cartTotal;

    // Determine discount tier
    const applicableTier = DISCOUNT_TIERS.find(
      (tier) => totalValue >= tier.min
    );

    // Calculate next tier info
    let nextTierInfo: { percent: number; amountNeeded: number } | null = null;
    if (!applicableTier || applicableTier.percent < 20) {
      const nextTier = DISCOUNT_TIERS.find((tier) => tier.min > totalValue);
      if (nextTier) {
        nextTierInfo = {
          percent: nextTier.percent,
          amountNeeded: nextTier.min - totalValue,
        };
      }
    }

    const response = {
      discountPercent: applicableTier?.percent || 0,
      discountCode: applicableTier?.code || null,
      lifetimeSpent,
      totalValue,
      nextTier: nextTierInfo,
      timestamp: Date.now(),
    };

    return Response.json(response);
  } catch (error) {
    console.error("Error calculating discount:", error);

    // Don't expose internal errors to client
    return Response.json(
      {
        discountPercent: 0,
        discountCode: null,
        error: "An error occurred while calculating your discount",
      },
      { status: 500 }
    );
  }
}

// Clean up old cache entries periodically
declare global {
  let __cacheCleanupInterval: ReturnType<typeof setInterval> | undefined;
}

if (typeof globalThis !== "undefined" && !__cacheCleanupInterval) {
  __cacheCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of customerCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        customerCache.delete(key);
      }
    }

    // Clean up rate limit map
    for (const [key, requests] of rateLimitMap.entries()) {
      const validRequests = requests.filter(
        (time) => now - time < RATE_LIMIT_WINDOW
      );
      if (validRequests.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, validRequests);
      }
    }
  }, 60 * 1000); // Clean up every minute
}
