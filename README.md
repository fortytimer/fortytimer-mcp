# fortyTimer MCP Server (read-only)

A thin MCP server that exposes the read-only API of a [fortyTimer](https://fortytimer.de)
installation as tools for MCP clients (Claude Desktop, Claude Code and others).
The server contains no business logic of its own – authorization, visibility
scoping and data minimization are enforced exclusively by the fortyTimer
installation the user connects to.

## Requirements

1. A **fortyTimer installation** with the license module **`api_readonly`
   ("fortyTimer API")** included in its license.
2. A **personal API token**, created in fortyTimer under
   *Profile → Security → API tokens*. The token is shown exactly once.
   It inherits the visibility of its owner's account (admin: all users,
   supervisor: own approver groups, employee: self only) and can never
   modify anything (GET only, `read` ability).
3. **Node.js ≥ 18** (bundled automatically when installed as a Claude
   Desktop extension).

## Installation (Claude Desktop extension)

Install the packaged `fortytimer-<version>.mcpb` file via double-click or
*Claude Desktop → Settings → Extensions*. During installation you are asked
for two values:

| Field | Value |
|---|---|
| fortyTimer URL | Base URL of your installation, e.g. `https://42.fortytimer.de` (for subdirectory installations include the path, e.g. `https://example.com/fortytimer/public`) |
| API token | Your personal token from fortyTimer → Profile → Security |

The token is stored in the operating system keychain, not in plain text.

## Manual configuration (any MCP client)

```json
{
    "mcpServers": {
        "fortytimer": {
            "command": "node",
            "args": ["/path/to/fortytimer-mcp/dist/index.js"],
            "env": {
                "FORTYTIMER_URL": "https://42.fortytimer.de",
                "FORTYTIMER_TOKEN": "<token>"
            }
        }
    }
}
```

## Building from source

```bash
npm install
npm run build
```

Packaging as a Claude Desktop extension:

```bash
npm prune --omit=dev
npx @anthropic-ai/mcpb pack . fortytimer-<version>.mcpb
npm install
```

## Tools

| Tool | Returns |
|---|---|
| `fortytimer_me` | Identity + visibility scope of the token owner |
| `fortytimer_get_overtime_balance` | Flextime balance as of a date (default: yesterday) |
| `fortytimer_get_vacation_balance` | Vacation account of a year (entitlement/carry-over/remaining/pending) |
| `fortytimer_list_time_entries` | Work time entries of a date range incl. minute-exact totals |
| `fortytimer_list_project_times` | Project time bookings, filterable by project/billability |
| `fortytimer_list_requests` | Leave requests by user/status/type/date range |
| `fortytimer_list_users` | Users within the visibility scope (for `user_id` parameters) |
| `fortytimer_list_projects` | Projects (for `project_id` filters) |

All tools are read-only (`readOnlyHint`). Date ranges are limited to 366 days
server-side, lists paginate with 50 entries per page (`page` parameter).
Durations are returned as exact integer minutes plus preformatted
hours:minutes strings. Free-text fields of sick-leave requests are never
returned by the API for data-protection reasons.

## Testing without a client

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

(Set the environment variables `FORTYTIMER_URL` / `FORTYTIMER_TOKEN` in the
Inspector UI under "Environment Variables".)

## Privacy Policy

Full privacy policy: https://fortytimer.de/privacy-policy.md

Summary:

- This MCP server **stores no data whatsoever**. It holds no databases,
  caches, log files or analytics.
- All data flows exclusively between the user's own computer and the
  fortyTimer installation the user configured – there is **no third-party
  service** involved and no data is transmitted to the extension author.
- The API token is provided by the user, kept by the MCP client
  (Claude Desktop stores it in the operating system keychain) and used solely
  as a `Bearer` header against the configured fortyTimer URL.
- Which personal data is visible is decided entirely by the connected
  fortyTimer installation: the token inherits the visibility of its owner's
  account, and fortyTimer suppresses special-category data (free texts of
  sick-leave requests) in every API response.
- Data retention is governed by the connected fortyTimer installation
  (its operator is the data controller); the extension retains nothing.
- Contact: info@fortytwo-consulting.de / https://fortytimer.de

## Security

- The token belongs in the local client configuration of the individual
  user – never commit or share it.
- Token revocation: fortyTimer → Profile → Security → API tokens → Delete
  (effective immediately); token creation and deletion are recorded in the
  fortyTimer audit log as security events.
- API rate limit: 60 requests per minute.

## License

MIT – see [LICENSE](LICENSE).
