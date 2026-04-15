# mcp-google_drive

Google Drive MCP Pack

Part of the [Pipeworx](https://pipeworx.io) open MCP gateway.

## Tools

| Tool | Description |
|------|-------------|
| `drive_list_files` | List files in Google Drive. Optionally filter with a search query using Drive query syntax. |
| `drive_get_file` | Get metadata for a specific Google Drive file by ID. Returns name, mimeType, size, owners, permissions, and more. |
| `drive_get_content` | Download or export the content of a Google Drive file. For Google Docs/Sheets/Slides, exports to a specified format. For binary files, returns the raw content. |
| `drive_create_file` | Create a new file in Google Drive with the given name, content, and MIME type. |
| `drive_search` | Search Google Drive files using Drive query syntax. Supports operators like name, mimeType, fullText, modifiedTime, owners, etc. |

## Quick Start

Add to your MCP client config:

```json
{
  "mcpServers": {
    "google_drive": {
      "url": "https://gateway.pipeworx.io/google_drive/mcp"
    }
  }
}
```

Or use the CLI:

```bash
npx pipeworx use google_drive
```

## License

MIT
