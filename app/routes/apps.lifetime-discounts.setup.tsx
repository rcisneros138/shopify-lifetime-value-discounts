import { json, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Card, Page, Button, Banner, Text, BlockStack } from "@shopify/polaris";

type ActionData = {
  success?: boolean;
  errors?: string[];
  created?: {
    metafield?: boolean;
    discounts?: string[];
  };
};

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const errors: string[] = [];
  const created = {
    metafield: false,
    discounts: [] as string[],
  };
  
  try {
    // 1. Create customer metafield definition
    const metafieldMutation = `
      mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition {
            id
            name
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    const metafieldResponse = await admin.graphql(metafieldMutation, {
      variables: {
        definition: {
          name: "Total Spent",
          namespace: "lifetime_value",
          key: "total_spent",
          type: "number_decimal",
          ownerType: "CUSTOMER",
          description: "Customer's total historical spending"
        }
      }
    });
    
    const metafieldData = await metafieldResponse.json();
    if (metafieldData.data?.metafieldDefinitionCreate?.userErrors?.length > 0) {
      errors.push(...metafieldData.data.metafieldDefinitionCreate.userErrors.map(e => e.message));
    } else {
      created.metafield = true;
    }
    
    // 2. Create automatic discount codes
    const discountTiers = [
      { code: 'LIFETIME_10', percent: '10', minAmount: '2500' },
      { code: 'LIFETIME_12', percent: '12', minAmount: '3500' },
      { code: 'LIFETIME_15', percent: '15', minAmount: '5000' },
      { code: 'LIFETIME_20', percent: '20', minAmount: '20000' },
    ];
    
    for (const tier of discountTiers) {
      const discountMutation = `
        mutation discountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
          discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
            automaticDiscountNode {
              id
              automaticDiscount {
                ... on DiscountAutomaticBasic {
                  title
                  startsAt
                  status
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
      
      const discountResponse = await admin.graphql(discountMutation, {
        variables: {
          automaticBasicDiscount: {
            title: `Lifetime Value ${tier.percent}% Discount`,
            code: tier.code,
            startsAt: new Date().toISOString(),
            customerGets: {
              value: {
                percentage: parseFloat(tier.percent) / 100
              },
              items: {
                all: true
              }
            },
            minimumRequirement: {
              subtotal: {
                greaterThanOrEqualToSubtotal: tier.minAmount
              }
            }
          }
        }
      });
      
      const discountData = await discountResponse.json();
      if (discountData.data?.discountAutomaticBasicCreate?.userErrors?.length > 0) {
        errors.push(...discountData.data.discountAutomaticBasicCreate.userErrors.map(e => `${tier.code}: ${e.message}`));
      } else {
        created.discounts.push(tier.code);
      }
    }
    
    return json<ActionData>({
      success: errors.length === 0,
      errors,
      created
    });
    
  } catch (error) {
    console.error('Setup error:', error);
    return json<ActionData>({
      success: false,
      errors: [error.message]
    });
  }
}

export default function SetupPage() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  return (
    <Page title="Lifetime Value Discounts Setup">
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="500">
            <Text as="p">
              This will create the necessary metafield definitions and automatic discount codes
              for the lifetime value discount system.
            </Text>
            
            <Text as="h3" variant="headingMd">
              What will be created:
            </Text>
            <BlockStack gap="200">
              <Text as="p">• Customer metafield: lifetime_value.total_spent</Text>
              <Text as="p">• Automatic discount: LIFETIME_10 (10% off)</Text>
              <Text as="p">• Automatic discount: LIFETIME_12 (12% off)</Text>
              <Text as="p">• Automatic discount: LIFETIME_15 (15% off)</Text>
              <Text as="p">• Automatic discount: LIFETIME_20 (20% off)</Text>
            </BlockStack>
            
            <Form method="post">
              <Button submit primary loading={isSubmitting}>
                Run Setup
              </Button>
            </Form>
          </BlockStack>
        </Card>
        
        {actionData?.success && (
          <Banner status="success">
            <p>Setup completed successfully!</p>
            {actionData.created?.metafield && <p>✓ Metafield definition created</p>}
            {actionData.created?.discounts?.map(code => (
              <p key={code}>✓ Discount {code} created</p>
            ))}
          </Banner>
        )}
        
        {actionData?.errors && actionData.errors.length > 0 && (
          <Banner status="critical">
            <p>Setup encountered errors:</p>
            {actionData.errors.map((error, i) => (
              <p key={i}>• {error}</p>
            ))}
          </Banner>
        )}
      </BlockStack>
    </Page>
  );
}