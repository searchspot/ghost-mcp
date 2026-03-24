import { getGhostApiConfig } from "./config";

type GhostAdminApiClient = any;
type GhostAdminApiConstructor = new (options: {
    key: string;
    url: string;
    version: string;
}) => GhostAdminApiClient;

let ghostApiClientInstance: GhostAdminApiClient | undefined;

function ensureBufferCompatibility(): void {
    const bufferModule = require("buffer") as typeof import("buffer") & {
        SlowBuffer?: typeof Buffer;
    };

    if (!bufferModule.SlowBuffer) {
        bufferModule.SlowBuffer = bufferModule.Buffer;
    }
}

function loadGhostAdminApi(): GhostAdminApiConstructor {
    ensureBufferCompatibility();

    const ghostAdminApiModule = require("@tryghost/admin-api") as
        | GhostAdminApiConstructor
        | { default: GhostAdminApiConstructor };

    return typeof ghostAdminApiModule === "function"
        ? ghostAdminApiModule
        : ghostAdminApiModule.default;
}

function createGhostApiClient(): GhostAdminApiClient {
    const GhostAdminAPI = loadGhostAdminApi();
    const config = getGhostApiConfig();

    return new GhostAdminAPI(config);
}

export function getGhostApiClient(): GhostAdminApiClient {
    if (!ghostApiClientInstance) {
        ghostApiClientInstance = createGhostApiClient();
    }

    return ghostApiClientInstance;
}

// Proxy the singleton so importing modules stays side-effect free until first use.
export const ghostApiClient: GhostAdminApiClient = new Proxy({} as GhostAdminApiClient, {
    get(_target, property, receiver) {
        return Reflect.get(getGhostApiClient(), property, receiver);
    },
    has(_target, property) {
        return property in getGhostApiClient();
    },
    set(_target, property, value, receiver) {
        return Reflect.set(getGhostApiClient(), property, value, receiver);
    }
});

// You can add helper functions here to wrap API calls and handle errors
// For example:
/*
export async function getPostById(postId: string): Promise<any> {
    try {
        const post = await ghostApiClient.posts.read({ id: postId });
        return post;
    } catch (error) {
        console.error(`Error fetching post ${postId}:`, error);
        throw new Error(`Failed to fetch post ${postId}`);
    }
}
*/
