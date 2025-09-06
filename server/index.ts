import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
	const start = Date.now();
	const path = req.path;
	let capturedJsonResponse: Record<string, any> | undefined = undefined;

	const originalResJson = res.json;
	res.json = function (bodyJson, ...args) {
		capturedJsonResponse = bodyJson;
		return originalResJson.apply(res, [bodyJson, ...args]);
	};

	res.on("finish", () => {
		const duration = Date.now() - start;
		if (path.startsWith("/api")) {
			let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
			if (capturedJsonResponse) {
				logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
			}

			if (logLine.length > 80) {
				logLine = logLine.slice(0, 79) + "…";
			}

			log(logLine);
		}
	});

	next();
});

(async () => {
	const server = await registerRoutes(app);

	app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
		const status = err.status || err.statusCode || 500;
		const message = err.message || "Internal Server Error";

		try {
			res.status(status).json({ message });
		} finally {
		}
	});

	// Detect build presence (dist/public) to decide serving mode
	const __dirname = path.dirname(fileURLToPath(import.meta.url));
	const builtPublic = path.resolve(__dirname, "..", "dist", "public");
	const hasBuild = fs.existsSync(builtPublic);
	const nodeEnv = process.env.NODE_ENV || (hasBuild ? "production" : "development");

	if (nodeEnv === "development") {
		await setupVite(app, server);
	} else {
		serveStatic(app);
	}

	const port = Number.parseInt(process.env.PORT || "5000", 10);
	const listenOptions: any = {
		port,
		host: "0.0.0.0",
	};
	// reusePort is not supported on Windows; enabling it causes ENOTSUP
	if (process.platform !== "win32") {
		listenOptions.reusePort = true;
	}
	server.listen(listenOptions, () => {
		log(`serving on port ${port}`);
	});
})();
