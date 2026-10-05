#!/usr/bin/env node
/**
 * fortyTimer MCP server (read-only)
 * =================================
 * Thin MCP client for the fortyTimer read-only API (license module
 * `api_readonly`). This server intentionally contains no business logic
 * of its own: authorization and visibility are enforced exclusively by
 * the fortyTimer installation – the token inherits the scope of its owner.
 *
 * Configuration via environment variables:
 *   FORTYTIMER_URL    Base URL of the installation (e.g. https://fortytimer.example.com)
 *   FORTYTIMER_TOKEN  Personal API token (fortyTimer → Profile → Security)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = (process.env.FORTYTIMER_URL ?? "").replace(/\/+$/, "");
const TOKEN = process.env.FORTYTIMER_TOKEN ?? "";

if (!BASE_URL || !TOKEN) {
    console.error(
        "fortytimer-mcp: The environment variables FORTYTIMER_URL and FORTYTIMER_TOKEN must be set.",
    );
    process.exit(1);
}

/** GET against the fortyTimer API; undefined parameters are omitted. */
async function apiGet(
    path: string,
    params: Record<string, string | number | boolean | undefined> = {},
): Promise<unknown> {
    const url = new URL(`${BASE_URL}/api/v1${path}`);

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== "") {
            url.searchParams.set(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
        }
    }

    let response: Response;

    try {
        response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                Accept: "application/json",
            },
        });
    } catch (error) {
        throw new Error(
            `fortyTimer is not reachable at ${BASE_URL} (${error instanceof Error ? error.message : String(error)}). ` +
                "Please check FORTYTIMER_URL and the network connection.",
        );
    }

    const body: unknown = await response.json().catch(() => null);

    if (response.ok) {
        return body;
    }

    const serverMessage =
        body !== null && typeof body === "object" && "message" in body
            ? String((body as { message: unknown }).message)
            : response.statusText;

    const hint: Record<number, string> = {
        401: "The API token is invalid or has been revoked. Create a new token in fortyTimer under Profile → Security → API tokens.",
        403:
            path === "/project-budgets"
                ? "Access denied – project budgets require the license modules 'fortyTimer API' and 'Projektzeit-Budget' and are available to administrators and supervisors only."
                : "Access denied – the license module 'fortyTimer API' is missing, the token lacks read permission, or the user account is no longer active.",
        // Older fortyTimer installations do not have the project budget endpoint yet
        404:
            path === "/project-budgets"
                ? "Not found – this fortyTimer installation does not provide project budgets yet; a newer fortyTimer version is required."
                : "Not found – a given user_id is probably outside the visibility scope of the token owner.",
        422: "Invalid parameters – see error details. Pass dates as YYYY-MM-DD and limit ranges to at most 366 days.",
        429: "Rate limit reached (60 requests per minute). Wait briefly and retry.",
    };

    let details = "";

    if (response.status === 422 && body !== null && typeof body === "object" && "errors" in body) {
        details = " " + JSON.stringify((body as { errors: unknown }).errors);
    }

    throw new Error(
        `HTTP ${response.status}: ${serverMessage}${details}${hint[response.status] ? " – " + hint[response.status] : ""}`,
    );
}

/** Uniform tool response: short headline + formatted JSON. */
function ok(headline: string, data: unknown) {
    return {
        content: [
            { type: "text" as const, text: `${headline}\n\n${JSON.stringify(data, null, 2)}` },
        ],
    };
}

function fail(error: unknown) {
    return {
        content: [
            { type: "text" as const, text: error instanceof Error ? error.message : String(error) },
        ],
        isError: true,
    };
}

const server = new McpServer({
    name: "fortytimer",
    version: "0.3.0",
});

const readOnly = { readOnlyHint: true, destructiveHint: false, openWorldHint: true };

const userIdParam = z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
        "User ID (from fortytimer_list_users). Omitted: the token owner. " +
            "Visibility is enforced server-side (admin: all users, supervisor: own approver groups, employee: self only).",
    );

const dateParam = (label: string) =>
    z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD")
        .optional()
        .describe(`${label} in YYYY-MM-DD format`);

const pageParam = z.number().int().positive().optional().describe("Result page (50 entries per page)");

server.registerTool(
    "fortytimer_me",
    {
        title: "Own account",
        description:
            "Identity and visibility scope of the token owner (admin | vorgesetzter/supervisor | mitarbeiter/employee). " +
            "Useful as a first call to know whose data is returned when no user_id is given.",
        inputSchema: {},
        annotations: readOnly,
    },
    async () => {
        try {
            return ok("Token owner:", await apiGet("/me"));
        } catch (error) {
            return fail(error);
        }
    },
);

server.registerTool(
    "fortytimer_get_overtime_balance",
    {
        title: "Flextime balance",
        description:
            "Flextime balance (Gleitzeit/overtime account) of a user as of a given date. " +
            "Defaults to yesterday – the same figure shown on the fortyTimer dashboard. " +
            "The response contains the exact balance as a signed hours:minutes string (formatted).",
        inputSchema: {
            user_id: userIdParam,
            as_of: dateParam("As-of date"),
        },
        annotations: readOnly,
    },
    async ({ user_id, as_of }) => {
        try {
            return ok("Flextime balance:", await apiGet("/overtime-balance", { user_id, as_of }));
        } catch (error) {
            return fail(error);
        }
    },
);

server.registerTool(
    "fortytimer_get_vacation_balance",
    {
        title: "Vacation balance",
        description:
            "Vacation account of a user for one year: entitlement, carry-over, adjustments, used, " +
            "remaining and pending (requested but not yet approved) days. Defaults to the current year. " +
            "Values are day counts; half days (0.5) are valid.",
        inputSchema: {
            user_id: userIdParam,
            year: z.number().int().min(1970).max(2060).optional().describe("Vacation year, default: current year"),
        },
        annotations: readOnly,
    },
    async ({ user_id, year }) => {
        try {
            return ok("Vacation balance:", await apiGet("/vacation-balance", { user_id, year }));
        } catch (error) {
            return fail(error);
        }
    },
);

server.registerTool(
    "fortytimer_list_time_entries",
    {
        title: "Work time entries",
        description:
            "Work time entries of a user within a date range (default: last 30 days, max. 366 days), " +
            "paginated with 50 entries per page. Durations are provided as exact integer minutes " +
            "(worked_minutes, total_worked_minutes) together with preformatted hours:minutes strings " +
            "(*_formatted); these minute-exact fields are the authoritative values, decimal hour sums " +
            "would introduce rounding errors.",
        inputSchema: {
            user_id: userIdParam,
            date_from: dateParam("From date"),
            date_to: dateParam("To date"),
            page: pageParam,
        },
        annotations: readOnly,
    },
    async ({ user_id, date_from, date_to, page }) => {
        try {
            return ok("Work time entries:", await apiGet("/time-entries", { user_id, date_from, date_to, page }));
        } catch (error) {
            return fail(error);
        }
    },
);

server.registerTool(
    "fortytimer_list_project_times",
    {
        title: "Project time entries",
        description:
            "Project time bookings of a user within a date range (default: last 30 days, max. 366 days), " +
            "optionally filtered by project and billability, paginated with 50 entries per page. " +
            "Durations are provided as exact integer minutes (minutes, total_minutes) together with " +
            "preformatted hours:minutes strings (*_formatted); these minute-exact fields are the " +
            "authoritative values, decimal hour sums would introduce rounding errors.",
        inputSchema: {
            user_id: userIdParam,
            project_id: z.number().int().positive().optional().describe("Project ID (from fortytimer_list_projects)"),
            billable: z.boolean().optional().describe("true = billable only, false = non-billable only"),
            date_from: dateParam("From date"),
            date_to: dateParam("To date"),
            page: pageParam,
        },
        annotations: readOnly,
    },
    async ({ user_id, project_id, billable, date_from, date_to, page }) => {
        try {
            return ok(
                "Project time entries:",
                await apiGet("/project-time-entries", { user_id, project_id, billable, date_from, date_to, page }),
            );
        } catch (error) {
            return fail(error);
        }
    },
);

server.registerTool(
    "fortytimer_list_requests",
    {
        title: "Leave requests",
        description:
            "Leave requests (vacation, flextime, sick leave) within the visibility scope of the token owner, " +
            "filterable by user, status, type and date range (overlap semantics). " +
            "Note: free-text fields of sick-leave requests are never returned by the API for data-protection reasons.",
        inputSchema: {
            user_id: userIdParam,
            status: z
                .enum(["pending", "approved", "rejected", "cancelled", "withdrawn", "cancellation_pending"])
                .optional()
                .describe("Request status"),
            type: z.enum(["vacation", "flextime", "sick_leave"]).optional().describe("Request type"),
            date_from: dateParam("From date"),
            date_to: dateParam("To date"),
            page: pageParam,
        },
        annotations: readOnly,
    },
    async ({ user_id, status, type, date_from, date_to, page }) => {
        try {
            return ok("Leave requests:", await apiGet("/requests", { user_id, status, type, date_from, date_to, page }));
        } catch (error) {
            return fail(error);
        }
    },
);

server.registerTool(
    "fortytimer_list_users",
    {
        title: "User list",
        description:
            "Users within the visibility scope of the token owner (source of user_id values for the other tools). " +
            "Active users by default; include_inactive = true also lists deactivated users.",
        inputSchema: {
            include_inactive: z.boolean().optional().describe("Also list inactive users"),
        },
        annotations: readOnly,
    },
    async ({ include_inactive }) => {
        try {
            return ok("Users:", await apiGet("/users", { include_inactive }));
        } catch (error) {
            return fail(error);
        }
    },
);

server.registerTool(
    "fortytimer_list_projects",
    {
        title: "Project list",
        description: "All projects with ID, name and active status (source of project_id values for project time filters).",
        inputSchema: {},
        annotations: readOnly,
    },
    async () => {
        try {
            return ok("Projects:", await apiGet("/projects"));
        } catch (error) {
            return fail(error);
        }
    },
);

server.registerTool(
    "fortytimer_list_project_budgets",
    {
        title: "Project budgets",
        description:
            "Remaining project time budget per project in minutes and H:MM, plus the configured warning threshold " +
            "and whether a project is below it. Projects without a maintained budget are listed with budget_maintained = false. " +
            "Requires the license modules 'fortyTimer API' and 'Projektzeit-Budget'; available to administrators and supervisors. " +
            "as_of is calculated from the current bookings up to that date, so a later correction of an earlier booking also changes past values.",
        inputSchema: {
            project_id: z
                .number()
                .int()
                .positive()
                .optional()
                .describe("Project ID (from fortytimer_list_projects). Omitted: all projects"),
            as_of: dateParam("Reference date (default: today, at most today)"),
        },
        annotations: readOnly,
    },
    async ({ project_id, as_of }) => {
        try {
            return ok("Project budgets:", await apiGet("/project-budgets", { project_id, as_of }));
        } catch (error) {
            return fail(error);
        }
    },
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`fortytimer-mcp: connected to ${BASE_URL}`);
