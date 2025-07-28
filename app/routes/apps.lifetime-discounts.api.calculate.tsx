import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// Discount tiers configuration
const DISCOUNT_TIERS = [
  { min: 20000, percent: 20, code: 'LIFETIME_20' },
  { min: 5000, percent: 15, code: 'LIFETIME_15' },
  { min: 3500, percent: 12, code: 'LIFETIME_12' },
  { min: 2500, percent: 10, code: 'LIFETIME_10' },
];

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.public.appProxy(request);
  
  try {
    const { cartTotal, customerId } = await request.json();
    
    // If no customer ID, no discount
    if (!customerId) {
      return json({ discountPercent: 0, discountCode: null });
    }
    
    // Get customer's lifetime spent from metafield
    const query = `
      query getCustomerLifetimeValue($id: ID!) {
        customer(id: $id) {
          id
          metafield(namespace: "lifetime_value", key: "total_spent") {
            value
          }
        }
      }
    `;
    
    const response = await admin.graphql(query, {
      variables: {
        id: `gid://shopify/Customer/${customerId}`
      }
    });
    
    const data = await response.json();
    const lifetimeSpent = parseFloat(data.data?.customer?.metafield?.value || '0');
    
    // Calculate total value (lifetime + current cart)
    const totalValue = lifetimeSpent + cartTotal;
    
    // Determine discount tier
    const applicableTier = DISCOUNT_TIERS.find(tier => totalValue >= tier.min);
    
    if (applicableTier) {
      return json({
        discountPercent: applicableTier.percent,
        discountCode: applicableTier.code,
        lifetimeSpent,
        totalValue
      });
    }
    
    return json({ discountPercent: 0, discountCode: null, lifetimeSpent, totalValue });
    
  } catch (error) {
    console.error('Error calculating discount:', error);
    return json({ discountPercent: 0, discountCode: null, error: error.message }, { status: 500 });
  }
}