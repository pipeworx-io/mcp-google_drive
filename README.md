# mcp-google_drive

Google Drive MCP Pack

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `drive_list_files` | List files in your Google Drive. Optionally filter by name, type, owner, or modified date (e.g., 'name contains "report"'). Returns file names, IDs, types, and metadata. |
| `drive_get_file` | Get metadata for a specific Drive file by ID. Returns name, type, size, owners, permissions, creation date, and last modified time. |
| `drive_get_content` | Download file content from Drive. Export Google Docs/Sheets/Slides to PDF, Word, Excel, etc., or retrieve raw content from other files. |
| `drive_create_file` | Create a new file in Drive with specified name, content, and type (e.g., 'text/plain', 'application/pdf'). Returns the file ID for future reference. |
| `drive_search` | Search Drive files by name, type, owner, modified date, or full text using query operators (e.g., 'name contains "report"', 'mimeType = application/pdf'). Returns matching files and IDs. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "google_drive": {
      "url": "https://gateway.pipeworx.io/google_drive/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Google_drive data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
