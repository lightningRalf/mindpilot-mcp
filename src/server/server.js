#!/usr/bin/env node
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var types_js_1 = require("@modelcontextprotocol/sdk/types.js");
var fastify_1 = require("fastify");
var websocket_1 = require("@fastify/websocket");
var static_1 = require("@fastify/static");
var path_1 = require("path");
var url_1 = require("url");
var open_1 = require("open");
var node_util_1 = require("node:util");
var mermaid_validator_js_1 = require("./mermaid-validator.js");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
var MermaidMCPDemo = /** @class */ (function () {
    function MermaidMCPDemo(port) {
        if (port === void 0) { port = 4000; }
        this.wsClients = new Set();
        this.isShuttingDown = false;
        this.lastDiagram = null;
        this.port = port;
        this.server = new index_js_1.Server({
            name: "mindpilot-mcp",
            version: "0.1.0",
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupMCPHandlers();
    }
    MermaidMCPDemo.prototype.setupMCPHandlers = function () {
        var _this = this;
        // List available tools
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        tools: [
                            {
                                name: "render_mermaid",
                                description: 'Render a Mermaid diagram to SVG format. CRITICAL RULES: 1) Node IDs must be alphanumeric without spaces (use A1, nodeA, start_node). 2) For node labels with special characters, wrap in quotes: A["Label with spaces"] or A["Process (step 1)"]. 3) For quotes in labels use &quot;, for < use &lt;, for > use &gt;. 4) For square brackets in labels use A["Array&#91;0&#93;"]. 5) Always close all brackets and quotes. 6) Use consistent arrow styles (either --> or ->). Example: graph TD\\n  A["Complex Label"] --> B{Decision?}\\n  B -->|Yes| C["Result &quot;OK&quot;"]\\n\\nIMPORTANT: If the diagram fails validation, the error message will explain what needs to be fixed. Please read the error carefully and retry with a corrected diagram.',
                                inputSchema: {
                                    type: "object",
                                    properties: {
                                        diagram: {
                                            type: "string",
                                            description: "Mermaid diagram syntax. MUST start with diagram type (graph TD, flowchart LR, sequenceDiagram, etc). Node IDs cannot have spaces. Use quotes for labels with spaces/special chars.",
                                        },
                                        background: {
                                            type: "string",
                                            description: "Background color",
                                            default: "white",
                                        },
                                    },
                                    required: ["diagram"],
                                },
                            },
                            {
                                name: "open_ui",
                                description: "Open the web-based user interface",
                                inputSchema: {
                                    type: "object",
                                    properties: {
                                        autoOpen: {
                                            type: "boolean",
                                            description: "Automatically open browser",
                                            default: true,
                                        },
                                    },
                                },
                            },
                        ],
                    }];
            });
        }); });
        // Handle tool calls
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, function (request) { return __awaiter(_this, void 0, void 0, function () {
            var _a, name, args, _b, diagram, background, validation, errorResult, renderResult, err_1, isProduction, url, error_1, debugInfo, _c, _d;
            var _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        _a = request.params, name = _a.name, args = _a.arguments;
                        _b = name;
                        switch (_b) {
                            case "render_mermaid": return [3 /*break*/, 1];
                            case "open_ui": return [3 /*break*/, 14];
                        }
                        return [3 /*break*/, 16];
                    case 1:
                        diagram = (args === null || args === void 0 ? void 0 : args.diagram) || "";
                        background = (args === null || args === void 0 ? void 0 : args.background) || "white";
                        return [4 /*yield*/, (0, mermaid_validator_js_1.validateMermaidSyntax)(diagram)];
                    case 2:
                        validation = _g.sent();
                        // If validation fails with errors, return the errors to MCP client
                        if (!validation.valid &&
                            validation.errors &&
                            validation.errors.length > 0) {
                            errorResult = {
                                success: false,
                                error: "Diagram validation failed: ".concat(validation.errors.join(", ")),
                                validation: validation,
                                format: "mermaid",
                                clientSideRender: true,
                                debug: {
                                    wsClients: this.wsClients.size,
                                    broadcast: false,
                                    timestamp: new Date().toISOString(),
                                },
                            };
                            return [2 /*return*/, {
                                    content: [
                                        {
                                            type: "text",
                                            text: JSON.stringify(errorResult, null, 2),
                                        },
                                    ],
                                }];
                        }
                        return [4 /*yield*/, this.renderMermaid(diagram, background)];
                    case 3:
                        renderResult = _g.sent();
                        // Add validation warnings to the result if any
                        if (validation.warnings && validation.warnings.length > 0) {
                            renderResult.warnings = validation.warnings;
                        }
                        if (!!this.fastify) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.setupUIServer()];
                    case 4:
                        _g.sent();
                        _g.label = 5;
                    case 5:
                        _g.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.fastify.listen({
                                port: this.port,
                                host: "0.0.0.0",
                            })];
                    case 6:
                        _g.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        err_1 = _g.sent();
                        // Server might already be running
                        if (err_1.code !== "EADDRINUSE") {
                            throw err_1;
                        }
                        return [3 /*break*/, 8];
                    case 8:
                        if (!(this.wsClients.size === 0)) return [3 /*break*/, 13];
                        isProduction = process.env.NODE_ENV !== "development";
                        url = isProduction
                            ? "http://localhost:".concat(this.port)
                            : "http://localhost:5173";
                        _g.label = 9;
                    case 9:
                        _g.trys.push([9, 12, , 13]);
                        return [4 /*yield*/, (0, open_1.default)(url)];
                    case 10:
                        _g.sent();
                        // Give the browser time to connect via WebSocket
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1500); })];
                    case 11:
                        // Give the browser time to connect via WebSocket
                        _g.sent();
                        return [3 /*break*/, 13];
                    case 12:
                        error_1 = _g.sent();
                        return [3 /*break*/, 13];
                    case 13:
                        // Cache the diagram for future connections
                        if (renderResult.success && renderResult.output) {
                            this.lastDiagram = {
                                diagram: renderResult.output,
                                timestamp: new Date().toISOString(),
                            };
                        }
                        // Broadcast to all WebSocket clients
                        this.broadcastToClients(__assign({ type: "render_result" }, renderResult));
                        debugInfo = __assign(__assign({}, renderResult), { debug: {
                                wsClients: this.wsClients.size,
                                broadcast: true,
                                timestamp: new Date().toISOString(),
                            } });
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: "text",
                                        text: JSON.stringify(debugInfo, null, 2),
                                    },
                                ],
                            }];
                    case 14:
                        _e = {};
                        _f = {
                            type: "text"
                        };
                        _d = (_c = JSON).stringify;
                        return [4 /*yield*/, this.openUI(args === null || args === void 0 ? void 0 : args.autoOpen)];
                    case 15: return [2 /*return*/, (_e.content = [
                            (_f.text = _d.apply(_c, [_g.sent(), null,
                                2]),
                                _f)
                        ],
                            _e)];
                    case 16: throw new Error("Unknown tool: ".concat(name));
                }
            });
        }); });
    };
    MermaidMCPDemo.prototype.setupUIServer = function () {
        return __awaiter(this, void 0, void 0, function () {
            var isMCPMode, isProduction, projectRoot, builtClientPath;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.fastify = (0, fastify_1.default)({
                            logger: false,
                        });
                        // Register WebSocket plugin
                        return [4 /*yield*/, this.fastify.register(websocket_1.default)];
                    case 1:
                        // Register WebSocket plugin
                        _a.sent();
                        isMCPMode = !process.stdin.isTTY;
                        isProduction = process.env.NODE_ENV !== "development";
                        if (!(isProduction || isMCPMode)) return [3 /*break*/, 3];
                        projectRoot = path_1.default.resolve(__dirname, "../..");
                        builtClientPath = path_1.default.join(projectRoot, "dist/public");
                        return [4 /*yield*/, this.fastify.register(static_1.default, {
                                root: builtClientPath,
                            })];
                    case 2:
                        _a.sent();
                        this.fastify.get("/", function (request, reply) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, reply.sendFile("index.html")];
                            });
                        }); });
                        _a.label = 3;
                    case 3:
                        // In development mode, we don't serve any HTML - Vite dev server handles the UI
                        // Debug endpoint
                        this.fastify.get("/api/debug", function (request, reply) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, reply.send({
                                        wsClients: this.wsClients.size,
                                        serverRunning: true,
                                        fastifyReady: this.fastify ? true : false,
                                    })];
                            });
                        }); });
                        // API routes for UI
                        this.fastify.post("/api/render", function (request, reply) { return __awaiter(_this, void 0, void 0, function () {
                            var _a, diagram, background, result, error_2;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 2, , 3]);
                                        _a = request.body, diagram = _a.diagram, background = _a.background;
                                        return [4 /*yield*/, this.renderMermaid(diagram, background)];
                                    case 1:
                                        result = _b.sent();
                                        // Broadcast to all WebSocket clients
                                        this.broadcastToClients(__assign({ type: "render_result" }, result));
                                        return [2 /*return*/, reply.send(result)];
                                    case 2:
                                        error_2 = _b.sent();
                                        return [2 /*return*/, reply.code(500).send({ error: error_2.message })];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); });
                        this.fastify.post("/api/validate", function (request, reply) { return __awaiter(_this, void 0, void 0, function () {
                            var diagram, result, error_3;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        diagram = request.body.diagram;
                                        return [4 /*yield*/, (0, mermaid_validator_js_1.validateMermaidSyntax)(diagram)];
                                    case 1:
                                        result = _a.sent();
                                        return [2 /*return*/, reply.send(result)];
                                    case 2:
                                        error_3 = _a.sent();
                                        return [2 /*return*/, reply.code(500).send({ error: error_3.message })];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); });
                        // WebSocket route
                        this.fastify.get("/ws", { websocket: true }, function (connection, req) {
                            var ws = connection.socket;
                            if (process.stdin.isTTY) {
                                console.log("WebSocket client connected");
                            }
                            _this.wsClients.add(ws);
                            // Send the last diagram if available
                            if (_this.lastDiagram) {
                                ws.send(JSON.stringify({
                                    type: "render_result",
                                    success: true,
                                    output: _this.lastDiagram.diagram,
                                    format: "mermaid",
                                    renderTime: 0,
                                    clientSideRender: true,
                                    cached: true,
                                    timestamp: _this.lastDiagram.timestamp,
                                }));
                            }
                            ws.on("message", function (data) { return __awaiter(_this, void 0, void 0, function () {
                                var message, _a, result, validation, error_4;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _b.trys.push([0, 6, , 7]);
                                            message = JSON.parse(data.toString());
                                            _a = message.type;
                                            switch (_a) {
                                                case "render": return [3 /*break*/, 1];
                                                case "validate": return [3 /*break*/, 3];
                                            }
                                            return [3 /*break*/, 5];
                                        case 1: return [4 /*yield*/, this.renderMermaid(message.diagram, message.background || "white")];
                                        case 2:
                                            result = _b.sent();
                                            ws.send(JSON.stringify(__assign({ type: "render_result" }, result)));
                                            return [3 /*break*/, 5];
                                        case 3: return [4 /*yield*/, (0, mermaid_validator_js_1.validateMermaidSyntax)(message.diagram)];
                                        case 4:
                                            validation = _b.sent();
                                            ws.send(JSON.stringify(__assign({ type: "validation_result" }, validation)));
                                            return [3 /*break*/, 5];
                                        case 5: return [3 /*break*/, 7];
                                        case 6:
                                            error_4 = _b.sent();
                                            ws.send(JSON.stringify({
                                                type: "error",
                                                message: error_4.message,
                                            }));
                                            return [3 /*break*/, 7];
                                        case 7: return [2 /*return*/];
                                    }
                                });
                            }); });
                            ws.on("close", function () {
                                if (process.stdin.isTTY) {
                                    console.log("WebSocket client disconnected");
                                }
                                _this.wsClients.delete(ws);
                            });
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    MermaidMCPDemo.prototype.broadcastToClients = function (message) {
        var messageStr = JSON.stringify(message);
        this.wsClients.forEach(function (client) {
            if (client.readyState === 1) {
                // 1 = OPEN state
                client.send(messageStr);
            }
        });
    };
    MermaidMCPDemo.prototype.renderMermaid = function (diagram_1) {
        return __awaiter(this, arguments, void 0, function (diagram, background) {
            var startTime;
            if (background === void 0) { background = "white"; }
            return __generator(this, function (_a) {
                startTime = Date.now();
                try {
                    // For CDN-based rendering, we'll return the diagram and let the client render it
                    return [2 /*return*/, {
                            success: true,
                            output: diagram,
                            format: "mermaid",
                            renderTime: Date.now() - startTime,
                            clientSideRender: true,
                        }];
                }
                catch (error) {
                    return [2 /*return*/, {
                            success: false,
                            format: "mermaid",
                            renderTime: Date.now() - startTime,
                            error: error.message,
                        }];
                }
                return [2 /*return*/];
            });
        });
    };
    MermaidMCPDemo.prototype.openUI = function () {
        return __awaiter(this, arguments, void 0, function (autoOpen) {
            var err_2, url, isListening, error_5;
            var _a, _b;
            if (autoOpen === void 0) { autoOpen = true; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 10, , 11]);
                        if (!!this.fastify) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.setupUIServer()];
                    case 1:
                        _c.sent();
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, this.fastify.listen({ port: this.port, host: "0.0.0.0" })];
                    case 3:
                        _c.sent();
                        // Add a small delay to ensure the server is fully ready
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                    case 4:
                        // Add a small delay to ensure the server is fully ready
                        _c.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        err_2 = _c.sent();
                        // Server might already be running
                        if (err_2.code !== "EADDRINUSE") {
                            throw err_2;
                        }
                        return [3 /*break*/, 6];
                    case 6:
                        url = "http://localhost:".concat(this.port);
                        isListening = ((_b = (_a = this.fastify) === null || _a === void 0 ? void 0 : _a.server) === null || _b === void 0 ? void 0 : _b.listening) || false;
                        if (!isListening) {
                            throw new Error("Fastify server failed to start - not listening on port " + this.port);
                        }
                        if (!autoOpen) return [3 /*break*/, 9];
                        return [4 /*yield*/, (0, open_1.default)(url)];
                    case 7:
                        _c.sent();
                        // Give the WebSocket time to connect
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 8:
                        // Give the WebSocket time to connect
                        _c.sent();
                        _c.label = 9;
                    case 9: return [2 /*return*/, {
                            success: true,
                            url: url,
                            port: this.port,
                            message: autoOpen ? "UI opened in browser" : "UI server started",
                            wsClients: this.wsClients.size,
                            serverListening: isListening,
                            fastifyReady: this.fastify ? true : false,
                        }];
                    case 10:
                        error_5 = _c.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: error_5.message,
                                stack: error_5.stack,
                            }];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    MermaidMCPDemo.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var isMCPMode, transport, err_3, err_4, error_6, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        isMCPMode = !process.stdin.isTTY && process.env.NODE_ENV !== "development";
                        if (!isMCPMode) return [3 /*break*/, 7];
                        transport = new stdio_js_1.StdioServerTransport();
                        return [4 /*yield*/, this.server.connect(transport)];
                    case 1:
                        _a.sent();
                        // Also start the UI server in MCP mode
                        return [4 /*yield*/, this.setupUIServer()];
                    case 2:
                        // Also start the UI server in MCP mode
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.fastify.listen({ port: this.port, host: "0.0.0.0" })];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        err_3 = _a.sent();
                        // Server might already be running, which is OK
                        if (err_3.code !== "EADDRINUSE") {
                            // Log errors to stderr so they don't interfere with stdio protocol
                            console.error("Failed to start Fastify server:", err_3);
                        }
                        return [3 /*break*/, 6];
                    case 6:
                        // Monitor parent process in MCP mode
                        this.monitorParentProcess();
                        return [3 /*break*/, 20];
                    case 7: 
                    // Standalone mode - only start UI server (no MCP server)
                    return [4 /*yield*/, this.setupUIServer()];
                    case 8:
                        // Standalone mode - only start UI server (no MCP server)
                        _a.sent();
                        _a.label = 9;
                    case 9:
                        _a.trys.push([9, 11, , 12]);
                        return [4 /*yield*/, this.fastify.listen({ port: this.port, host: "0.0.0.0" })];
                    case 10:
                        _a.sent();
                        console.log("Mindpilot MCP server running on port ".concat(this.port));
                        return [3 /*break*/, 12];
                    case 11:
                        err_4 = _a.sent();
                        console.error("Failed to start server:", err_4);
                        process.exit(1);
                        return [3 /*break*/, 12];
                    case 12:
                        if (!(process.env.NODE_ENV !== "development")) return [3 /*break*/, 17];
                        _a.label = 13;
                    case 13:
                        _a.trys.push([13, 15, , 16]);
                        return [4 /*yield*/, (0, open_1.default)("http://localhost:".concat(this.port))];
                    case 14:
                        _a.sent();
                        return [3 /*break*/, 16];
                    case 15:
                        error_6 = _a.sent();
                        console.log("\u2139\uFE0F  Could not auto-open browser. Visit http://localhost:".concat(this.port, " manually"));
                        return [3 /*break*/, 16];
                    case 16: return [3 /*break*/, 20];
                    case 17:
                        _a.trys.push([17, 19, , 20]);
                        return [4 /*yield*/, (0, open_1.default)("http://localhost:5173")];
                    case 18:
                        _a.sent();
                        return [3 /*break*/, 20];
                    case 19:
                        error_7 = _a.sent();
                        console.log("ℹ️  Could not auto-open browser. Visit http://localhost:5173 manually");
                        return [3 /*break*/, 20];
                    case 20: return [2 /*return*/];
                }
            });
        });
    };
    MermaidMCPDemo.prototype.monitorParentProcess = function () {
        var _this = this;
        // Check if parent process is still alive periodically
        var checkInterval = setInterval(function () {
            try {
                // If we can't kill with signal 0 (just check), parent is gone
                process.kill(process.ppid, 0);
            }
            catch (error) {
                // Parent process is gone, exit gracefully
                clearInterval(checkInterval);
                _this.cleanup().then(function () {
                    process.exit(0);
                });
            }
        }, 1000); // Check every second
    };
    MermaidMCPDemo.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isShuttingDown)
                            return [2 /*return*/];
                        this.isShuttingDown = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        // Close all WebSocket connections
                        this.wsClients.forEach(function (client) {
                            if (client.readyState === 1) {
                                client.close();
                            }
                        });
                        this.wsClients.clear();
                        if (!this.fastify) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.fastify.close()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: 
                    // Close MCP server
                    return [4 /*yield*/, this.server.close()];
                    case 4:
                        // Close MCP server
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_8 = _a.sent();
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return MermaidMCPDemo;
}());
// Parse command line arguments
var values = (0, node_util_1.parseArgs)({
    options: {
        port: {
            type: "string",
            short: "p",
            default: "4000",
        },
    },
}).values;
// Parse and validate port
var port = parseInt(values.port, 10);
if (isNaN(port) || port < 1 || port > 65535) {
    console.error("Invalid port number: ".concat(values.port));
    process.exit(1);
}
// Start the demo server
var demo = new MermaidMCPDemo(port);
// Handle graceful shutdown
process.on("SIGINT", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, demo.cleanup()];
            case 1:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
process.on("SIGTERM", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, demo.cleanup()];
            case 1:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
// Handle stdin end (when Claude Desktop exits)
process.stdin.on("end", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, demo.cleanup()];
            case 1:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
// Handle stdin close
process.stdin.on("close", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, demo.cleanup()];
            case 1:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
// Handle uncaught errors
process.on("uncaughtException", function (error) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!process.stdin.isTTY) {
                    // In MCP mode, don't log to stdout
                }
                else {
                    console.error("Uncaught exception:", error);
                }
                return [4 /*yield*/, demo.cleanup()];
            case 1:
                _a.sent();
                process.exit(1);
                return [2 /*return*/];
        }
    });
}); });
demo.start().catch(function (error) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!process.stdin.isTTY) {
                    // In MCP mode, don't log to stdout
                }
                else {
                    console.error("Failed to start server:", error);
                }
                return [4 /*yield*/, demo.cleanup()];
            case 1:
                _a.sent();
                process.exit(1);
                return [2 /*return*/];
        }
    });
}); });
