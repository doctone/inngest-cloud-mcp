#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  listEvents,
  getEvent,
  getEventRuns,
  getRun,
  cancelRun,
  listFunctions,
  createCancellation,
  listCancellations,
} from "./inngest-api.js";

function getSigningKey(): string {
  const key = process.env["INNGEST_SIGNING_KEY"];
  if (!key) {
    throw new Error(
      "INNGEST_SIGNING_KEY environment variable is required. " +
        "Find it at https://app.inngest.com/env/production/manage/signing-key"
    );
  }
  return key;
}

const server = new McpServer({
  name: "inngest-cloud",
  version: "0.1.0",
});

server.tool(
  "list_events",
  "List recent events in reverse chronological order. Use name filter to find specific event types.",
  {
    limit: z.number().min(1).max(100).optional().describe("Max events to return (default 20)"),
    cursor: z.string().optional().describe("Pagination cursor from previous response"),
    name: z.string().optional().describe("Filter by event name (e.g. 'app/user.created')"),
    received_after: z.string().optional().describe("Only events received after this time (ISO 8601). Defaults to 7 days ago"),
    received_before: z.string().optional().describe("Only events received before this time (ISO 8601). Defaults to now"),
  },
  async ({ limit, cursor, name, received_after, received_before }) => {
    const result = await listEvents(getSigningKey(), { limit, cursor, name, received_after, received_before });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "get_event",
  "Get a single event by its ID (ULID).",
  {
    eventId: z.string().describe("The event ID (ULID)"),
  },
  async ({ eventId }) => {
    const result = await getEvent(getSigningKey(), eventId);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "get_event_runs",
  "List all function runs that were triggered by a specific event.",
  {
    eventId: z.string().describe("The event ID (ULID)"),
  },
  async ({ eventId }) => {
    const result = await getEventRuns(getSigningKey(), eventId);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "get_run",
  "Get detailed status and output for a specific function run.",
  {
    runId: z.string().describe("The run ID (ULID)"),
  },
  async ({ runId }) => {
    const result = await getRun(getSigningKey(), runId);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "cancel_run",
  "Cancel a specific function run. Use with caution — this is not reversible.",
  {
    runId: z.string().describe("The run ID (ULID) to cancel"),
  },
  async ({ runId }) => {
    const result = await cancelRun(getSigningKey(), runId);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "list_functions",
  "List all functions registered for a given app.",
  {
    appName: z.string().describe("The app name/slug (e.g. 'my-app')"),
  },
  async ({ appName }) => {
    const result = await listFunctions(getSigningKey(), appName);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "create_cancellation",
  "Bulk cancel function runs matching criteria. Cancels all runs of a function within a time range, with an optional expression filter.",
  {
    app_id: z.string().describe("The app ID"),
    function_id: z.string().describe("The function ID to cancel runs for"),
    started_after: z
      .string()
      .describe("Cancel runs started after this time (ISO 8601)"),
    started_before: z
      .string()
      .describe("Cancel runs started before this time (ISO 8601)"),
    if: z
      .string()
      .optional()
      .describe("Optional CEL expression to filter which runs to cancel"),
  },
  async (params) => {
    const result = await createCancellation(getSigningKey(), params);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "list_cancellations",
  "List all active bulk cancellation rules.",
  {},
  async () => {
    const result = await listCancellations(getSigningKey());
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
