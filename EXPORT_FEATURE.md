# Export Diagram Feature

## Overview

The `export_diagram` MCP tool allows programmatic creation of Mermaid diagrams and export to PNG format for external services like Discord, Slack, GitHub, etc.

## MCP Tool: export_diagram

### Description
Export a Mermaid diagram to PNG format for external services. Returns base64 PNG data and edit URL.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `diagram` | string | ✅ | - | Mermaid diagram syntax |
| `title` | string | ✅ | - | Title for the diagram (max 50 characters) |
| `background` | string | ❌ | "white" | Background color |
| `width` | number | ❌ | 1920 | PNG width in pixels |
| `height` | number | ❌ | 1080 | PNG height in pixels |
| `format` | string | ❌ | "base64" | Output format (base64 or buffer) |

### Response Format

```typescript
interface ExportResult {
  type: "success" | "error";
  diagram: string;
  pngData?: string;  // base64 encoded PNG data
  editUrl?: string;  // localhost URL for editing the diagram
  error?: string;
  details?: string;
  mimeType?: string;
  size?: number;  // file size in bytes
}
```

## Usage Examples

### Basic Usage

```javascript
const result = await mcp.call("export_diagram", {
  diagram: `graph TD
    A[Start] --> B[Process]
    B --> C[End]`,
  title: "Simple Workflow"
});

if (result.type === "success") {
  // Send PNG to Discord/Slack
  const pngBuffer = Buffer.from(result.pngData, 'base64');
  await sendToDiscord(pngBuffer);
  
  // Provide edit link
  console.log(`Edit diagram: ${result.editUrl}`);
}
```

### Advanced Usage with Custom Settings

```javascript
const result = await mcp.call("export_diagram", {
  diagram: `sequenceDiagram
    participant A as User
    participant B as System
    A->>B: Request
    B-->>A: Response`,
  title: "API Sequence",
  background: "white",
  width: 1600,
  height: 900,
  format: "base64"
});
```

### Error Handling

```javascript
const result = await mcp.call("export_diagram", {
  diagram: "invalid syntax",
  title: "Test"
});

if (result.type === "error") {
  console.error(`Export failed: ${result.error}`);
  if (result.details) {
    console.error(`Details: ${result.details}`);
  }
}
```

## Use Cases

### Discord Bot Integration

```javascript
// Discord bot command
async function createDiagram(message, diagramCode) {
  const result = await mcp.call("export_diagram", {
    diagram: diagramCode,
    title: "User Diagram"
  });
  
  if (result.type === "success") {
    const attachment = new Discord.MessageAttachment(
      Buffer.from(result.pngData, 'base64'),
      'diagram.png'
    );
    
    await message.reply({
      content: `Here's your diagram! [Edit it](${result.editUrl})`,
      files: [attachment]
    });
  }
}
```

### Slack Integration

```javascript
// Slack app
app.command('/diagram', async ({ command, ack, respond }) => {
  await ack();
  
  const result = await mcp.call("export_diagram", {
    diagram: command.text,
    title: "Slack Diagram"
  });
  
  if (result.type === "success") {
    await respond({
      response_type: 'in_channel',
      blocks: [{
        type: 'image',
        image_url: `data:image/png;base64,${result.pngData}`,
        alt_text: 'Generated diagram'
      }, {
        type: 'actions',
        elements: [{
          type: 'button',
          text: { type: 'plain_text', text: 'Edit Diagram' },
          url: result.editUrl
        }]
      }]
    });
  }
});
```

### GitHub Issues/PRs

```javascript
// Auto-generate architecture diagrams for PRs
async function addDiagramToIssue(issueId, diagramSpec) {
  const result = await mcp.call("export_diagram", {
    diagram: diagramSpec,
    title: `Architecture Diagram #${issueId}`
  });
  
  if (result.type === "success") {
    // Upload PNG to GitHub
    const imageUrl = await uploadToGitHub(result.pngData);
    
    // Add comment with diagram and edit link
    await github.issues.createComment({
      issue_number: issueId,
      body: `![Architecture Diagram](${imageUrl})\n\n[Edit diagram](${result.editUrl})`
    });
  }
}
```

## Implementation Notes

### Current Status
- ✅ MCP tool structure implemented
- ✅ HTTP endpoint functional (/api/export)
- ✅ Diagram validation and history saving
- ✅ Error handling for invalid diagrams
- ✅ Edit URL generation
- ⚠️ PNG generation currently uses placeholder (200x100 blue PNG)

### Future Enhancements
- [ ] Full SVG-to-PNG conversion using headless browser
- [ ] Dynamic PNG generation with actual diagram content
- [ ] Custom styling and theme support
- [ ] Batch export capabilities
- [ ] Export to other formats (SVG, PDF)

### API Compatibility
This feature maintains backward compatibility with existing tools:
- `render_mermaid` - Still available for SVG rendering
- `open_ui` - Still available for browser interface

The new `export_diagram` tool extends functionality without breaking existing integrations.