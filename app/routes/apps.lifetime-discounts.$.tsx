import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// Handle all app proxy routes under /apps/lifetime-discounts/*
export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.public.appProxy(request);
  
  const url = new URL(request.url);
  const path = url.pathname.replace('/apps/lifetime-discounts/', '');
  
  // Health check endpoint
  if (path === 'health') {
    return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // Default response
  return new Response(JSON.stringify({ 
    message: 'Lifetime Value Discounts API',
    version: '1.0.0',
    endpoints: {
      calculate: '/apps/lifetime-discounts/api/calculate',
      health: '/apps/lifetime-discounts/health'
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.public.appProxy(request);
  
  const url = new URL(request.url);
  const path = url.pathname.replace('/apps/lifetime-discounts/', '');
  
  // Route to appropriate handler
  if (path === 'api/calculate') {
    // Forward to calculate endpoint
    const { action: calculateAction } = await import('./apps.lifetime-discounts.api.calculate');
    return calculateAction({ request, params: {}, context: {} } as ActionFunctionArgs);
  }
  
  return new Response("Not Found", { status: 404 });
}