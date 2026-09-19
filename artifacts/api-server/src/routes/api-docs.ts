import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/openapi.json", (_req, res) => {
  res.json({
    openapi: "3.1.0",
    info: {
      title: "Stock Control API",
      version: "0.1.0",
      description:
        "JSON API for listing, retrieving, creating, updating and deleting stock items.",
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
    },
  });
});

export default router;