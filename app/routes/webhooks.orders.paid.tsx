import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session, payload } = await authenticate.webhook(request);

  if (!admin || !session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  try {
    // Extract order data
    const order = payload as any;
    const customerId = order.customer?.id?.split('/').pop();
    
    if (!customerId) {
      console.log("No customer ID in order, skipping lifetime value update");
      return new Response("OK", { status: 200 });
    }

    // Get current lifetime value
    const query = `
      query getCustomerLifetimeValue($id: ID!) {
        customer(id: $id) {
          id
          metafield(namespace: "lifetime_value", key: "total_spent") {
            id
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
    const existingValue = parseFloat(data.data?.customer?.metafield?.value || '0');
    const orderTotal = parseFloat(order.total_price || '0');
    const newTotal = existingValue + orderTotal;

    // Update metafield
    const mutation = `
      mutation updateCustomerMetafield($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer {
            id
            metafield(namespace: "lifetime_value", key: "total_spent") {
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const updateResponse = await admin.graphql(mutation, {
      variables: {
        input: {
          id: `gid://shopify/Customer/${customerId}`,
          metafields: [
            {
              namespace: "lifetime_value",
              key: "total_spent",
              value: newTotal.toString(),
              type: "number_decimal"
            }
          ]
        }
      }
    });

    const updateData = await updateResponse.json();
    
    if (updateData.data?.customerUpdate?.userErrors?.length > 0) {
      console.error("Error updating customer metafield:", updateData.data.customerUpdate.userErrors);
      throw new Error("Failed to update customer lifetime value");
    }

    console.log(`Updated customer ${customerId} lifetime value from ${existingValue} to ${newTotal}`);
    
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Return 200 to prevent webhook retry
    return new Response("OK", { status: 200 });
  }
}