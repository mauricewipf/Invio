// Desktop launcher - wraps the original backend with desktop-specific features
// This file is NOT part of the upstream Invio repo

// Set database path from environment variable before importing app
const dataDir = Deno.env.get("INVIO_DATA_DIR");
if (dataDir) {
  // Ensure the data directory exists
  try {
    await Deno.mkdir(dataDir, { recursive: true });
  } catch (_) {
    // Directory may already exist
  }
  
  // Set DATABASE_PATH for upstream initDatabase() to use
  // Upstream code: const dbPath = resolvePath(getEnv("DATABASE_PATH", "./invio.db")!);
  Deno.env.set("DATABASE_PATH", `${dataDir}/invio.db`);

  const executableDir = Deno.execPath().replace(/\/[^/]*$/, "");
  const resourcesDir = executableDir.replace(/\/MacOS$/, "/Resources");
  const migrationsPath = `${resourcesDir}/migrations.sql`;
  try {
    await Deno.stat(migrationsPath);
    Deno.env.set("MIGRATIONS_PATH", migrationsPath);
  } catch (_) {
    // Development builds can still fall back to the repository-relative path.
  }

  for (const template of ["professional-modern.html", "minimalist-clean.html"]) {
    try {
      await Deno.copyFile(`${resourcesDir}/${template}`, `${dataDir}/${template}`);
    } catch (_) {
      // Templates are best-effort; initDatabase() has a safe fallback.
    }
  }

  if (!Deno.env.get("JWT_SECRET")) {
    const secretPath = `${dataDir}/jwt-secret`;
    let secret: string | undefined;
    try {
      secret = (await Deno.readTextFile(secretPath)).trim();
    } catch (_) {
      secret = crypto.randomUUID() + crypto.randomUUID();
      await Deno.writeTextFile(secretPath, secret, { create: true });
    }
    Deno.env.set("JWT_SECRET", secret);
  }
}

Deno.env.set("ORIGIN", Deno.env.get("ORIGIN") ?? "http://localhost:3000");
Deno.env.set("ADMIN_USER", Deno.env.get("ADMIN_USER") ?? "admin");
Deno.env.set("ADMIN_PASS", Deno.env.get("ADMIN_PASS") ?? "admin");

// Import and run the original app
// This starts the backend server
await import("./app.ts");

// Add desktop-specific graceful shutdown after server is running
const shutdown = async () => {
  console.log("[Desktop] Shutting down backend...");
  // Attempt to close database - best effort
  try {
    // @ts-ignore - accessing internal for cleanup
    const { getDatabase } = await import("./database/init.ts");
    const db = getDatabase();
    if (db) {
      try { db.close(); } catch (_) {}
    }
  } catch (_) {
    // If import fails, process is likely already terminating
  }
  Deno.exit(0);
};

// Register signal handlers
try {
  Deno.addSignalListener("SIGTERM", shutdown);
  Deno.addSignalListener("SIGINT", shutdown);
  console.log("[Desktop] Graceful shutdown handlers registered");
} catch (_) {
  // Windows doesn't support signals, ignore
}

// Keep the process alive (app.ts will start the server)
await new Promise(() => {});
