#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getGhostApiConfig } from "./config";

function getPackageVersion(): string {
    try {
        const packageJsonPath = path.resolve(__dirname, "..", "package.json");
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version?: string };
        return packageJson.version || "0.0.0";
    } catch {
        return "0.0.0";
    }
}

const SERVER_VERSION = getPackageVersion();

function printHelp(): void {
    console.log(`Ghost MCP Server

Usage:
  ghost-mcp
  ghost-mcp --help
  ghost-mcp --version

Environment:
  GHOST_API_URL         Your Ghost admin URL, for example https://yourblog.com
  GHOST_ADMIN_API_KEY   Ghost Admin API key
  GHOST_API_VERSION     Optional Ghost Admin API version (default: v5.0)

Notes:
  Starts an MCP stdio server when run without flags.
  Use with an MCP client such as Claude Desktop or Codex.`);
}

function handleCliArgs(): boolean {
    const args = process.argv.slice(2);

    if (args.includes("--help") || args.includes("-h")) {
        printHelp();
        return true;
    }

    if (args.includes("--version") || args.includes("-v")) {
        console.log(SERVER_VERSION);
        return true;
    }

    if (args.length > 0) {
        console.error(`Unknown argument: ${args[0]}`);
        console.error("Run ghost-mcp --help to see supported options.");
        process.exit(1);
    }

    return false;
}

async function createServer(): Promise<McpServer> {
    const [
        resources,
        postsTools,
        membersTools,
        usersTools,
        tagsTools,
        tiersTools,
        offersTools,
        newslettersTools,
        invitesTools,
        rolesTools,
        webhooksTools,
        prompts
    ] = await Promise.all([
        import("./resources.js"),
        import("./tools/posts.js"),
        import("./tools/members.js"),
        import("./tools/users.js"),
        import("./tools/tags.js"),
        import("./tools/tiers.js"),
        import("./tools/offers.js"),
        import("./tools/newsletters.js"),
        import("./tools/invites.js"),
        import("./tools/roles.js"),
        import("./tools/webhooks.js"),
        import("./prompts.js")
    ]);

    const server = new McpServer({
        name: "ghost-mcp-ts",
        version: SERVER_VERSION,
        capabilities: {
            resources: {},
            tools: {},
            prompts: {},
            logging: {}
        }
    });

    server.resource("user", new ResourceTemplate("user://{user_id}", { list: undefined }), resources.handleUserResource);
    server.resource("member", new ResourceTemplate("member://{member_id}", { list: undefined }), resources.handleMemberResource);
    server.resource("tier", new ResourceTemplate("tier://{tier_id}", { list: undefined }), resources.handleTierResource);
    server.resource("offer", new ResourceTemplate("offer://{offer_id}", { list: undefined }), resources.handleOfferResource);
    server.resource("newsletter", new ResourceTemplate("newsletter://{newsletter_id}", { list: undefined }), resources.handleNewsletterResource);
    server.resource("post", new ResourceTemplate("post://{post_id}", { list: undefined }), resources.handlePostResource);
    server.resource("blog-info", "blog://info", resources.handleBlogInfoResource);

    postsTools.registerPostTools(server);
    membersTools.registerMemberTools(server);
    usersTools.registerUserTools(server);
    tagsTools.registerTagTools(server);
    tiersTools.registerTierTools(server);
    offersTools.registerOfferTools(server);
    newslettersTools.registerNewsletterTools(server);
    invitesTools.registerInviteTools(server);
    rolesTools.registerRoleTools(server);
    webhooksTools.registerWebhookTools(server);
    prompts.registerPrompts(server);

    return server;
}

// Set up and connect to the standard I/O transport
async function startServer() {
    if (handleCliArgs()) {
        return;
    }

    getGhostApiConfig();

    const server = await createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Ghost MCP TypeScript Server running on stdio"); // Log to stderr
}

// Start the server
startServer().catch((error: any) => { // Add type annotation for error
    console.error("Fatal error starting server:", error);
    process.exit(1);
});
