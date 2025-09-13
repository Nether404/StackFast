import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { 
  errorHandler, 
  requestIdMiddleware, 
  notFoundHandler, 
  logger 
} from "./middleware/error-handler";
import { 
  securityHeaders, 
  requestSizeLimit 
} from "./middleware/security";
import { 
  rateLimitWhitelist, 
  rateLimitHeaders 
} from "./middleware/rate-limiting";
import { 
  securityMonitoringMiddleware 
} from "./middleware/audit";
import { compressionHeaders } from "./middleware/compression";
import { 
  performanceMonitoringMiddleware, 
  systemMetricsCollector 
} from "./middleware/performance-monitoring";
import { analyticsTrackingMiddleware } from "./middleware/analytics";
import { 
  requestResponseLogger, 
  requestTracingMiddleware 
} from "./middleware/debug";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Security middleware - apply first
app.use(securityHeaders);

// Add request ID middleware
app.use(requestIdMiddleware);

// Debug middleware (development only)
app.use(requestResponseLogger);
app.use(requestTracingMiddleware);

// Performance monitoring middleware
app.use(performanceMonitoringMiddleware);

// Analytics tracking middleware
app.use(analyticsTrackingMiddleware);

// Request size limiting
app.use(requestSizeLimit('10mb'));

// Rate limiting with whitelist support
app.use('/api', rateLimitWhitelist());

// Rate limit headers
app.use(rateLimitHeaders);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Security monitoring for failed requests
app.use(securityMonitoringMiddleware);

// Compression headers for debugging
app.use(compressionHeaders());

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

	// Add 404 handler for unmatched routes
	app.use(notFoundHandler);

	// Add centralized error handling middleware
	app.use(errorHandler);

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
		
		// Start system metrics collection
		systemMetricsCollector.start();
		log('Performance monitoring initialized');
	});
})();
