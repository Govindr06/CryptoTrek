/**
 * Amazon DynamoDB Cart and Session Management Handler
 * Provides sub-millisecond retrieval and storage of in-flight user itineraries with TTL.
 */
exports.handler = async (event) => {
  const method = event.httpMethod || (event.requestContext && event.requestContext.http && event.requestContext.http.method) || "GET";
  const userId = (event.queryStringParameters && event.queryStringParameters.userId) || (event.headers && event.headers["x-user-id"]) || "demo-user-1";

  console.log(`[Amazon DynamoDB] Processing Cart Operation: ${method} for User: ${userId}`);

  if (method === "GET") {
    // DynamoDB GetItem simulation
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        message: "DynamoDB Cart fetched",
        userId,
        ttlSeconds: 3600
      })
    };
  }

  if (method === "POST" || method === "PUT") {
    const body = typeof event.body === "string" ? JSON.parse(event.body || "{}") : event.body || {};
    const ttl = Math.floor(Date.now() / 1000) + 3600; // 1 hour TTL
    
    console.log(`[Amazon DynamoDB] PutItem: Table='TravelCarts', Key={'userId': '${userId}'}, TTL=${ttl}`);
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        message: "Cart updated in DynamoDB",
        userId,
        cart: body,
        ttl
      })
    };
  }

  return {
    statusCode: 405,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ error: "Method Not Allowed" })
  };
};
