// src/tools/posts.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ghostApiClient } from "../ghostApi";

// Parameter schemas as ZodRawShape (object literals)
const browseParams = {
  filter: z.string().optional(),
  limit: z.number().optional(),
  page: z.number().optional(),
  order: z.string().optional(),
  include: z.string().optional(),
  formats: z.string().optional(),
};
const readParams = {
  id: z.string().optional(),
  slug: z.string().optional(),
  include: z.string().optional(),
  formats: z.string().optional(),
};
const postMetadataParams = {
  canonical_url: z.string().nullable().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  og_image: z.string().nullable().optional(),
  og_title: z.string().nullable().optional(),
  og_description: z.string().nullable().optional(),
  twitter_image: z.string().nullable().optional(),
  twitter_title: z.string().nullable().optional(),
  twitter_description: z.string().nullable().optional(),
};
const addParams = {
  title: z.string(),
  html: z.string().optional(),
  lexical: z.string().optional(),
  status: z.string().optional(),
  custom_excerpt: z.string().nullable().optional(),
  feature_image: z.string().nullable().optional(),
  feature_image_alt: z.string().nullable().optional(),
  feature_image_caption: z.string().nullable().optional(),
  ...postMetadataParams,
};
const editParams = {
  id: z.string(),
  title: z.string().optional(),
  html: z.string().optional(),
  lexical: z.string().optional(),
  status: z.string().optional(),
  custom_excerpt: z.string().nullable().optional(),
  feature_image: z.string().nullable().optional(),
  feature_image_alt: z.string().nullable().optional(),
  feature_image_caption: z.string().nullable().optional(),
  ...postMetadataParams,
  updated_at: z.string(),
};
const editMetadataParams = {
  id: z.string(),
  updated_at: z.string(),
  ...postMetadataParams,
};
const deleteParams = {
  id: z.string(),
};

export function registerPostTools(server: McpServer) {
  // Browse posts
  server.tool(
    "posts_browse",
    browseParams,
    async (args, _extra) => {
      const posts = await ghostApiClient.posts.browse(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(posts, null, 2),
          },
        ],
      };
    }
  );

  // Read post
  server.tool(
    "posts_read",
    readParams,
    async (args, _extra) => {
      const post = await ghostApiClient.posts.read(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(post, null, 2),
          },
        ],
      };
    }
  );

  // Add post
  server.tool(
    "posts_add",
    addParams,
    async (args, _extra) => {
      // If html is present, use source: "html" to ensure Ghost uses the html content
      const options = args.html ? { source: "html" } : undefined;
      const post = await ghostApiClient.posts.add(args, options);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(post, null, 2),
          },
        ],
      };
    }
  );

  // Edit post
  server.tool(
    "posts_edit",
    editParams,
    async (args, _extra) => {
      // If html is present, use source: "html" to ensure Ghost uses the html content for updates
      const options = args.html ? { source: "html" } : undefined;
      const post = await ghostApiClient.posts.edit(args, options);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(post, null, 2),
          },
        ],
      };
    }
  );

  // Edit post metadata (SEO/social metadata fields)
  server.tool(
    "posts_edit_metadata",
    editMetadataParams,
    async (args, _extra) => {
      const post = await ghostApiClient.posts.edit(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(post, null, 2),
          },
        ],
      };
    }
  );

  // Delete post
  server.tool(
    "posts_delete",
    deleteParams,
    async (args, _extra) => {
      await ghostApiClient.posts.delete(args);
      return {
        content: [
          {
            type: "text",
            text: `Post with id ${args.id} deleted.`,
          },
        ],
      };
    }
  );
}
