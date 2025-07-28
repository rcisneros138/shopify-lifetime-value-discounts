import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session, payload } = await authenticate.webhook(request);

  if (!admin || !session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  try {
    // Extract customer data
    const customer = payload as any;
    const customerId = customer.id?.split('/').pop();
    
    if (!customerId) {
      return new Response("OK", { status: 200 });
    }

    // Log customer update for monitoring
    console.log(`Customer ${customerId} updated:`, {
      email: customer.email,
      tags: customer.tags,
      state: customer.state
    });

    // You can add additional logic here if needed
    // For example, recalculating discounts if customer tags change
    
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Customer update webhook error:", error);
    // Return 200 to prevent webhook retry
    return new Response("OK", { status: 200 });
  }
}