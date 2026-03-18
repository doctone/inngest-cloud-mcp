# inngest-cloud-mcp

MCP server for the [Inngest](https://www.inngest.com/) Cloud REST API — inspect functions, runs, and events in production from Claude Code, Cursor, or any MCP client.

## Setup

### Claude Code

```bash
claude mcp add inngest-cloud -- npx inngest-cloud-mcp
```

Then set the `INNGEST_SIGNING_KEY` environment variable. Find yours at [app.inngest.com](https://app.inngest.com/env/production/manage/signing-key).

### Manual (`.mcp.json`)

```json
{
  "mcpServers": {
    "inngest-cloud": {
      "command": "npx",
      "args": ["inngest-cloud-mcp"],
      "env": {
        "INNGEST_SIGNING_KEY": "your-signing-key"
      }
    }
  }
}
```

## Tools

| Tool | Description |
| --- | --- |
| `list_events` | List recent events with optional name/time filters |
| `get_event` | Get a single event by ID |
| `get_event_runs` | List function runs triggered by an event |
| `get_run` | Get status and output of a function run |
| `cancel_run` | Cancel a specific function run |
| `list_functions` | List all functions for an app |
| `create_cancellation` | Bulk cancel runs matching criteria |
| `list_cancellations` | List active bulk cancellation rules |

## Development

```bash
pnpm install
pnpm run dev        # Run with tsx
pnpm run build      # Build with tsup
pnpm run typecheck  # Type check
```

## License

MIT
