export interface GhostApiConfig {
    key: string;
    url: string;
    version: string;
}

function getRequiredEnv(name: "GHOST_API_URL" | "GHOST_ADMIN_API_KEY"): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

export function getGhostApiConfig(): GhostApiConfig {
    return {
        url: getRequiredEnv("GHOST_API_URL"),
        key: getRequiredEnv("GHOST_ADMIN_API_KEY"),
        version: process.env.GHOST_API_VERSION || "v5.0"
    };
}
