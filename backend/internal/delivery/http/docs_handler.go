package http

import (
	_ "embed"
	"net/http"

	"github.com/labstack/echo/v4"
)

//go:embed static/openapi.yaml
var openapiSpec []byte

const swaggerUIHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Focus ASTU CP Hub — API Reference</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0f0f0f; }
    .swagger-ui .topbar { background: #0f1b2d; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "/api/docs/openapi.yaml",
      dom_id: "#swagger-ui",
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: "BaseLayout",
      deepLinking: true,
      displayRequestDuration: true,
      filter: true,
      persistAuthorization: true,
    });
  </script>
</body>
</html>`

func RegisterDocsRoutes(e *echo.Echo) {
	e.GET("/api/docs", func(c echo.Context) error {
		return c.HTML(http.StatusOK, swaggerUIHTML)
	})
	e.GET("/api/docs/openapi.yaml", func(c echo.Context) error {
		return c.Blob(http.StatusOK, "application/yaml", openapiSpec)
	})
}
