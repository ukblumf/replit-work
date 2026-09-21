import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/openapi.json", (_req, res) => {
  res.json({
    openapi: "3.1.0",
    info: {
      title: "Stock Control and Ordering API",
      version: "0.1.0",
      description:
        "Authenticated JSON API for stock items and purchase orders with order lines.",
    },
    servers: [{ url: "/api" }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API key",
        },
      },
    },
    paths: {
      "/stock": {
        get: { summary: "List stock items", parameters: ["partNumber"] },
        post: { summary: "Create a stock item" },
      },
      "/stock/summary": {
        get: { summary: "Get inventory totals" },
      },
      "/stock/{partNumber}": {
        get: { summary: "Retrieve a stock item" },
        patch: { summary: "Update a stock item" },
        delete: { summary: "Delete a stock item" },
      },
      "/stock/{partNumber}/adjust": {
        post: { summary: "Atomically adjust a stock quantity (409 if insufficient)" },
      },
      "/orders": {
        get: {
          summary: "List orders",
          parameters: ["orderNumber", "partNumber"],
        },
        post: { summary: "Create an order with lines" },
      },
      "/orders/summary": {
        get: { summary: "Get order totals and status counts" },
      },
      "/order/{orderNumber}": {
        get: { summary: "Retrieve an order and its lines" },
        patch: { summary: "Update an order and its lines" },
        delete: { summary: "Delete an order" },
      },
    },
  });
});

export default router;