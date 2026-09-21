---
name: API artifact bootstrap
description: Replit artifact bootstrap currently exposes web app types but not a direct API type.
---

When a standalone API service is needed and the artifact bootstrap rejects an API type, bootstrap a clean web artifact with the intended slug, then replace its validated artifact configuration with the existing API service pattern. Keep the API package independent and change the managed workflow to the API service command.

**Why:** The direct API bootstrap type is not available in the current artifact callback, while validated artifact configuration supports the required service routing and workflow shape.

**How to apply:** Do not retry the unsupported API artifact type; use the scaffold-and-replace flow and verify the resulting service health route.