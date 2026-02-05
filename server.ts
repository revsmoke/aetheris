import { Hono } from "hono";
import { serveStatic } from "hono/middleware";

const app = new Hono();

// Proxy for Google Environments API
app.get("/api/solar/*", async (c: any) => {
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    const path = c.req.path.replace("/api/solar/", "");
    const url = `https://solar.googleapis.com/v1/${path}${c.req.raw.url.split('?')[1] ? '?' + c.req.raw.url.split('?')[1] : ''}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();
    return c.json(data);
});

// Proxy for Google Air Quality API
app.get("/api/airquality/*", async (c: any) => {
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    const path = c.req.path.replace("/api/airquality/", "");
    const url = `https://airquality.googleapis.com/v1/${path}${c.req.raw.url.split('?')[1] ? '?' + c.req.raw.url.split('?')[1] : ''}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();
    return c.json(data);
});

// Proxy for Google Pollen API
app.get("/api/pollen/*", async (c: any) => {
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    const path = c.req.path.replace("/api/pollen/", "");
    const url = `https://pollen.googleapis.com/v1/${path}${c.req.raw.url.split('?')[1] ? '?' + c.req.raw.url.split('?')[1] : ''}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();
    return c.json(data);
});

// AIAI Report Generation (Gemini)
app.post("/api/aiai/report", async (c: any) => {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    const { solar, airQuality, pollen } = await c.req.json();

    const prompt = `
    As an expert environmental architect, analyze the following site data and provide a concise set of design interventions to improve sustainability and human comfort.
    
    Data:
    - Solar Potential: ${solar}
    - Air Quality: ${airQuality}
    - Pollen Levels: ${pollen}
    
    Output in Markdown format with headers. Recommend specific architectural features (e.g., green roofs, solar baffles, air filtration lobbies).
  `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    const data = await response.json();
    const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text || "No recommendation available at this time.";

    return c.json({ suggestion });
});

// Serve frontend
app.use("/*", serveStatic({ root: "./frontend" }));

Deno.serve(app.fetch);
