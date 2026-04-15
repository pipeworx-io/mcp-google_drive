interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Google Drive MCP Pack
 *
 * Requires OAuth connection — gateway injects credentials via _context.google_drive.
 * Tools: list files, get file metadata, get file content, create file, search.
 */


interface DriveContext {
  google_drive?: { accessToken: string };
}

const API = 'https://www.googleapis.com/drive/v3';

async function gFetch(ctx: DriveContext, url: string, options: RequestInit = {}) {
  if (!ctx.google_drive) {
    return { error: 'connection_required', message: 'Connect your Google account at https://pipeworx.io/account' };
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${ctx.google_drive.accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Drive API error (${res.status}): ${text}`);
  }
  return res.json();
}

async function gFetchText(ctx: DriveContext, url: string) {
  if (!ctx.google_drive) {
    return { error: 'connection_required', message: 'Connect your Google account at https://pipeworx.io/account' };
  }
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${ctx.google_drive.accessToken}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Drive API error (${res.status}): ${text}`);
  }
  return res.text();
}

const tools: McpToolExport['tools'] = [
  {
    name: 'drive_list_files',
    description: 'List files in Google Drive. Optionally filter with a search query using Drive query syntax.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        q: { type: 'string', description: 'Drive search query (e.g., "name contains \'report\'" or "mimeType=\'application/pdf\'")' },
        page_size: { type: 'number', description: 'Maximum number of files to return (default 10, max 100)' },
        page_token: { type: 'string', description: 'Token for fetching the next page of results' },
        order_by: { type: 'string', description: 'Sort order (e.g., "modifiedTime desc", "name")' },
      },
      required: [],
    },
  },
  {
    name: 'drive_get_file',
    description: 'Get metadata for a specific Google Drive file by ID. Returns name, mimeType, size, owners, permissions, and more.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        file_id: { type: 'string', description: 'The ID of the file to retrieve' },
        fields: { type: 'string', description: 'Comma-separated list of fields to include (default: id,name,mimeType,size,createdTime,modifiedTime,owners,webViewLink)' },
      },
      required: ['file_id'],
    },
  },
  {
    name: 'drive_get_content',
    description: 'Download or export the content of a Google Drive file. For Google Docs/Sheets/Slides, exports to a specified format. For binary files, returns the raw content.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        file_id: { type: 'string', description: 'The ID of the file to download' },
        export_mime_type: { type: 'string', description: 'MIME type to export Google Workspace files to (e.g., "text/plain", "application/pdf", "text/csv"). Required for Google Docs/Sheets/Slides.' },
      },
      required: ['file_id'],
    },
  },
  {
    name: 'drive_create_file',
    description: 'Create a new file in Google Drive with the given name, content, and MIME type.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Name for the new file' },
        content: { type: 'string', description: 'Text content of the file' },
        mime_type: { type: 'string', description: 'MIME type of the file (e.g., "text/plain", "application/json", "text/html")' },
        parent_folder_id: { type: 'string', description: 'ID of the parent folder (optional, defaults to root)' },
      },
      required: ['name', 'content', 'mime_type'],
    },
  },
  {
    name: 'drive_search',
    description: 'Search Google Drive files using Drive query syntax. Supports operators like name, mimeType, fullText, modifiedTime, owners, etc.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Drive search query (e.g., "fullText contains \'quarterly report\'" or "modifiedTime > \'2024-01-01\'")' },
        page_size: { type: 'number', description: 'Maximum number of results (default 10, max 100)' },
      },
      required: ['query'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const context = (args._context ?? {}) as DriveContext;
  delete args._context;

  switch (name) {
    case 'drive_list_files': {
      const pageSize = Math.min(100, Math.max(1, (args.page_size as number) ?? 10));
      const params = new URLSearchParams({
        pageSize: String(pageSize),
        fields: 'nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,owners,webViewLink)',
      });
      if (args.q) params.set('q', args.q as string);
      if (args.page_token) params.set('pageToken', args.page_token as string);
      if (args.order_by) params.set('orderBy', args.order_by as string);
      return gFetch(context, `${API}/files?${params}`);
    }
    case 'drive_get_file': {
      const fileId = args.file_id as string;
      const fields = (args.fields as string) ?? 'id,name,mimeType,size,createdTime,modifiedTime,owners,webViewLink,parents,shared,permissions';
      const params = new URLSearchParams({ fields });
      return gFetch(context, `${API}/files/${encodeURIComponent(fileId)}?${params}`);
    }
    case 'drive_get_content': {
      const fileId = args.file_id as string;
      const exportMimeType = args.export_mime_type as string | undefined;
      if (exportMimeType) {
        const params = new URLSearchParams({ mimeType: exportMimeType });
        const content = await gFetchText(context, `${API}/files/${encodeURIComponent(fileId)}/export?${params}`);
        return { file_id: fileId, export_mime_type: exportMimeType, content };
      }
      const content = await gFetchText(context, `${API}/files/${encodeURIComponent(fileId)}?alt=media`);
      return { file_id: fileId, content };
    }
    case 'drive_create_file': {
      const { name: fileName, content, mime_type, parent_folder_id } = args as {
        name: string; content: string; mime_type: string; parent_folder_id?: string;
      };
      const metadata: Record<string, unknown> = { name: fileName, mimeType: mime_type };
      if (parent_folder_id) metadata.parents = [parent_folder_id];
      // Use multipart upload
      const boundary = '-------pipeworx_boundary';
      const body = [
        `--${boundary}`,
        'Content-Type: application/json; charset=UTF-8',
        '',
        JSON.stringify(metadata),
        `--${boundary}`,
        `Content-Type: ${mime_type}`,
        '',
        content,
        `--${boundary}--`,
      ].join('\r\n');

      if (!context.google_drive) {
        return { error: 'connection_required', message: 'Connect your Google account at https://pipeworx.io/account' };
      }
      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${context.google_drive.accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Google Drive API error (${res.status}): ${text}`);
      }
      return res.json();
    }
    case 'drive_search': {
      const query = args.query as string;
      const pageSize = Math.min(100, Math.max(1, (args.page_size as number) ?? 10));
      const params = new URLSearchParams({
        q: query,
        pageSize: String(pageSize),
        fields: 'nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,owners,webViewLink)',
      });
      return gFetch(context, `${API}/files?${params}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool, meter: { credits: 10 }, provider: 'google_drive' } satisfies McpToolExport;
