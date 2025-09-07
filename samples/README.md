# Sample PNG Exports from mindpilot-mcp

These PNG files demonstrate the `export_diagram` MCP tool functionality.

## Usage

The MCP tool can be called like this:

```javascript
const result = await mcp.call("export_diagram", {
  diagram: "graph TD\n  A[Start] --> B[Process]\n  B --> C[End]", 
  title: "My Diagram",
  background: "white",
  width: 1920,
  height: 1080
});

// Returns:
// {
//   type: "success",
//   pngData: "base64EncodedPNGData...",
//   editUrl: "http://localhost:4000/artifacts/abc123",
//   mimeType: "image/png", 
//   size: 1234
// }
```

## Sample Files

- **architecture_overview.png** - Shows how AI assistants can use the MCP tool
- **mcp_tool_integration_flow.png** - Sequence diagram of the integration process  
- **feature_benefits_network.png** - Network effects visualization

## Integration Examples

### Discord Bot
```javascript
const pngBuffer = Buffer.from(result.pngData, 'base64');
await channel.send({
  content: `Here's your diagram! [Edit it](${result.editUrl})`,
  files: [{ attachment: pngBuffer, name: 'diagram.png' }]
});
```

### Slack App
```javascript
await slack.files.upload({
  channels: channel,
  file: Buffer.from(result.pngData, 'base64'),
  filename: 'diagram.png',
  initial_comment: `Generated diagram: ${result.editUrl}`
});
```

### GitHub Issues  
```javascript
// Upload to GitHub as asset and reference in issue
const imageUrl = await uploadToGitHub(result.pngData);
await github.issues.createComment({
  body: `![Architecture](${imageUrl})\n\n[Edit diagram](${result.editUrl})`
});
```
