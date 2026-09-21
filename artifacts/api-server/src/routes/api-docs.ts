import { Router, type IRouter } from "express";
import spec from "../generated/openapi.json";

const router: IRouter = Router();

// Serves the real OpenAPI contract (generated from lib/api-spec/openapi.yaml by codegen).
// `servers` is made absolute from the request so tools such as n8n can import it directly.
router.get("/openapi.json", (req, res) => {
  // Behind the Replit proxy the public scheme arrives in X-Forwarded-Proto.
  const proto = req.get("x-forwarded-proto")?.split(",")[0] ?? req.protocol;
  const base = `${proto}://${req.get("host")}${req.baseUrl}`;
  // The YAML title stays "Api" for codegen; give importers a readable name.
  res.json({
    ...spec,
    info: { ...spec.info, title: "Stock Control and Ordering API" },
    servers: [{ url: base, description: "This server" }],
  });
});

export default router;
