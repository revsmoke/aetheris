/**
 * Aetheris Server
 * Proxies Google Environmental APIs and handles AI report generation
 */

import { Hono } from "hono";
import { serveStatic } from "hono/deno";

const app = new Hono();

// CORS middleware
app.use("*", async (c, next) => {
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (c.req.method === "OPTIONS") {
        return new Response(null, { status: 204 });
    }

    await next();
});

// Proxy for Google Solar API
app.get("/api/solar/*", async (c) => {
    try {
        const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
        if (!apiKey) {
            return c.json({ error: "API key not configured" }, 500);
        }

        const path = c.req.path.replace("/api/solar/", "");
        const url = new URL(`https://solar.googleapis.com/v1/${path}`);

        // Copy query params
        const queryParams = c.req.query();
        Object.entries(queryParams).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });

        url.searchParams.set("key", apiKey);

        const response = await fetch(url.toString());
        const data = await response.json();

        return c.json(data);
    } catch (err) {
        console.error("Solar API error:", err);
        return c.json({ error: "Failed to fetch solar data" }, 500);
    }
});

// Proxy for Google Air Quality API
app.post("/api/airquality/*", async (c) => {
    try {
        const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
        if (!apiKey) {
            return c.json({ error: "API key not configured" }, 500);
        }

        const path = c.req.path.replace("/api/airquality/", "");
        const url = new URL(`https://airquality.googleapis.com/v1/${path}`);
        url.searchParams.set("key", apiKey);

        const body = await c.req.json();

        const response = await fetch(url.toString(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        return c.json(data);
    } catch (err) {
        console.error("Air Quality API error:", err);
        return c.json({ error: "Failed to fetch air quality data" }, 500);
    }
});

app.get("/api/airquality/*", async (c) => {
    try {
        const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
        if (!apiKey) {
            return c.json({ error: "API key not configured" }, 500);
        }

        const path = c.req.path.replace("/api/airquality/", "");
        const url = new URL(`https://airquality.googleapis.com/v1/${path}`);

        const queryParams = c.req.query();
        Object.entries(queryParams).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });

        url.searchParams.set("key", apiKey);

        const response = await fetch(url.toString());
        const data = await response.json();

        return c.json(data);
    } catch (err) {
        console.error("Air Quality API error:", err);
        return c.json({ error: "Failed to fetch air quality data" }, 500);
    }
});

// Proxy for Google Pollen API
app.get("/api/pollen/*", async (c) => {
    try {
        const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
        if (!apiKey) {
            return c.json({ error: "API key not configured" }, 500);
        }

        const path = c.req.path.replace("/api/pollen/", "");
        const url = new URL(`https://pollen.googleapis.com/v1/${path}`);

        const queryParams = c.req.query();
        Object.entries(queryParams).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });

        url.searchParams.set("key", apiKey);

        const response = await fetch(url.toString());
        const data = await response.json();

        return c.json(data);
    } catch (err) {
        console.error("Pollen API error:", err);
        return c.json({ error: "Failed to fetch pollen data" }, 500);
    }
});

// AIAI Report Generation (Gemini)
app.post("/api/aiai/report", async (c) => {
    try {
        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) {
            return c.json({
                suggestion: "## AI Report Generation Unavailable\n\nTo enable AI-powered design intelligence, please configure a Gemini API key in your environment variables.\n\n### Manual Analysis Guidelines\n\nBased on the environmental data available:\n\n1. **Solar Potential**: Review the solar panel capacity and sunshine hours to determine optimal renewable energy strategies\n2. **Air Quality**: Consider enhanced ventilation or filtration systems if AQI indicates moderate to poor air quality\n3. **Pollen Levels**: Design landscape and HVAC systems to minimize allergen exposure for occupants\n\n### Recommended Next Steps\n\n- Configure Gemini API key for automated analysis\n- Review site data across all environmental factors\n- Develop integrated design responses addressing each environmental condition"
            });
        }

        const { location, coordinates, solar, airQuality, pollen } = await c.req.json();

        const prompt = `As an expert environmental architect and sustainability consultant, analyze the following site data and provide a comprehensive design intelligence report.

## SITE INFORMATION
Location: ${location || 'Unknown'}
Coordinates: ${coordinates ? `${coordinates.lat}, ${coordinates.lng}` : 'Not provided'}

## ENVIRONMENTAL DATA

### Solar Analysis
${solar ? `
- Maximum Solar Panels: ${solar.maxPanels?.toLocaleString() || 'N/A'}
- Annual Sunshine Hours: ${solar.sunshineHours?.toLocaleString() || 'N/A'}
- Panel Capacity: ${solar.panelCapacityWatts || 'N/A'} watts
- Carbon Offset Factor: ${solar.carbonOffsetFactor || 'N/A'} kg/MWh
- Roof Segments Analyzed: ${solar.roofSegments || 'N/A'}
` : 'Solar data not available'}

### Air Quality Analysis
${airQuality ? `
- Current AQI: ${airQuality.aqi || 'N/A'}
- Air Quality Category: ${airQuality.category || 'N/A'}
- Dominant Pollutant: ${airQuality.dominantPollutant?.toUpperCase() || 'N/A'}
` : 'Air quality data not available'}

### Pollen Forecast
${pollen ? `
- Grass Pollen: ${pollen.grass || 'N/A'}
- Tree Pollen: ${pollen.tree || 'N/A'}
- Weed Pollen: ${pollen.weed || 'N/A'}
` : 'Pollen data not available'}

## REQUIRED OUTPUT

Provide a detailed architectural analysis report in the following format:

# Site Environmental Analysis

## Executive Summary
Brief overview of the site's environmental characteristics and key design opportunities.

## Solar Design Strategy
Specific recommendations for:
- Solar panel placement and sizing
- Building orientation for optimal solar gain
- Shading strategies (fixed/adaptive)
- Daylighting opportunities
- Potential annual energy generation

## Air Quality Response
Design interventions addressing air quality:
- Ventilation strategies
- Filtration system recommendations
- Landscape buffers
- Building envelope considerations

## Biophilic & Wellness Design
Recommendations for occupant health:
- Landscape design considering pollen levels
- Outdoor space planning
- Indoor air quality management
- Connection to nature

## Sustainability Recommendations
Specific actionable items:
- Renewable energy potential
- Carbon reduction strategies
- Material suggestions
- Certification opportunities (LEED, WELL, BREEAM)

## Design Risk Factors
Potential challenges and mitigation strategies:
- Environmental hazards
- Seasonal variations
- Climate change adaptation

## Priority Actions
List the top 5 immediate design actions ranked by impact and feasibility.

Format the response in clean Markdown with clear hierarchy and actionable insights. Be specific and quantitative where possible.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048
                    }
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            console.error("Gemini API error:", data.error);
            return c.json({
                suggestion: "## Error Generating Report\n\nThe AI service encountered an error. Please try again later.\n\n### Key Design Considerations\n\n1. **Maximize solar potential** through optimal orientation and PV integration\n2. **Address air quality** with appropriate ventilation and filtration\n3. **Design for occupant wellness** considering environmental factors\n4. **Implement sustainable strategies** appropriate for the site conditions"
            });
        }

        const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No recommendations available at this time.";

        return c.json({ suggestion });
    } catch (err) {
        console.error("Report generation error:", err);
        return c.json({
            suggestion: "## Report Generation Error\n\nWe encountered an issue generating your report. Please check your API configuration and try again.\n\n### General Design Guidelines\n\n- **Solar**: Orient building to maximize south-facing exposure (north in southern hemisphere)\n- **Air Quality**: Consider enhanced HVAC filtration and operable windows for ventilation\n- **Wellness**: Integrate natural elements and ensure good indoor air quality\n- **Sustainability**: Pursue renewable energy integration and efficient building envelope"
        });
    }
});

// Config Endpoint
app.get("/api/config", (c) => {
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    return c.json({
        googleMapsApiKey: apiKey || "",
        hasApiKey: !!apiKey
    });
});

// Health check
app.get("/api/health", (c) => {
    return c.json({
        status: "ok",
        version: "1.0.0",
        timestamp: new Date().toISOString()
    });
});

// Serve frontend
app.use("/*", serveStatic({ root: "./frontend" }));

// SPA fallback
app.get("*", serveStatic({ path: "./frontend/index.html" }));

console.log("🌅 Aetheris server starting on http://localhost:8000");
Deno.serve({ port: 8000 }, app.fetch);
