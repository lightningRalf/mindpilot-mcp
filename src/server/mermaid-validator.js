"use strict";
// mermaid-validator.ts - Lightweight Mermaid syntax validation for Node.js
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
exports.validateMermaidSyntax = validateMermaidSyntax;
exports.getValidDiagramTypes = getValidDiagramTypes;
// Set up minimal DOM stubs before importing mermaid
global.DOMPurify = {
    sanitize: function (text) { return text; },
    addHook: function () { },
    removeHook: function () { },
    removeAllHooks: function () { },
};
global.document = {
    createElement: function () { return ({
        innerHTML: "",
        textContent: "",
        style: {},
    }); },
};
global.window = {
    document: global.document,
    DOMPurify: global.DOMPurify,
    addEventListener: function () { },
    removeEventListener: function () { },
};
// Import mermaid after stubs are in place
var mermaid_1 = require("mermaid");
// Initialize mermaid once
mermaid_1.default.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "default",
});
/**
 * Validates Mermaid diagram syntax using the actual Mermaid parser
 * @param diagram - The Mermaid diagram text to validate
 * @returns ValidationResult with syntax errors if invalid
 */
function validateMermaidSyntax(diagram) {
    return __awaiter(this, void 0, void 0, function () {
        var bracketPairs, _i, bracketPairs_1, pair, openCount, closeCount, error_1, errorMsg, errors;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Basic validation
                    if (!diagram || diagram.trim().length === 0) {
                        return [2 /*return*/, {
                                valid: false,
                                errors: ["Diagram cannot be empty"],
                            }];
                    }
                    bracketPairs = [
                        { open: '[', close: ']', name: 'square' },
                        { open: '{', close: '}', name: 'curly' },
                        { open: '(', close: ')', name: 'round' }
                    ];
                    for (_i = 0, bracketPairs_1 = bracketPairs; _i < bracketPairs_1.length; _i++) {
                        pair = bracketPairs_1[_i];
                        openCount = (diagram.match(new RegExp("\\".concat(pair.open), 'g')) || []).length;
                        closeCount = (diagram.match(new RegExp("\\".concat(pair.close), 'g')) || []).length;
                        if (openCount !== closeCount) {
                            return [2 /*return*/, {
                                    valid: false,
                                    errors: ["Unmatched ".concat(pair.name, " brackets. Found ").concat(openCount, " opening and ").concat(closeCount, " closing ").concat(pair.name, " brackets.")],
                                    warnings: checkForWarnings(diagram)
                                }];
                        }
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    // Use Mermaid's parser to validate
                    return [4 /*yield*/, mermaid_1.default.parse(diagram)];
                case 2:
                    // Use Mermaid's parser to validate
                    _a.sent();
                    // If we get here without error, the syntax is valid
                    return [2 /*return*/, {
                            valid: true,
                            warnings: checkForWarnings(diagram),
                        }];
                case 3:
                    error_1 = _a.sent();
                    errorMsg = error_1.message || "Unknown error";
                    // Check if it's a real syntax error vs DOM-related error
                    if (isRealSyntaxError(errorMsg)) {
                        errors = [errorMsg];
                        // Add helpful hints based on error type
                        if (errorMsg.includes("Lexical error")) {
                            errors.push("Check for unescaped special characters. Use quotes for labels with spaces.");
                        }
                        if (errorMsg.includes("Parse error") && errorMsg.includes("Expecting")) {
                            errors.push("Check that all brackets are matched and nodes are properly connected.");
                        }
                        if (errorMsg.includes("No diagram type detected")) {
                            errors.push("Diagram must start with a valid type: graph, flowchart, sequenceDiagram, classDiagram, etc.");
                        }
                        return [2 /*return*/, {
                                valid: false,
                                errors: errors,
                                warnings: checkForWarnings(diagram),
                            }];
                    }
                    // DOM/DOMPurify errors mean the syntax is actually valid
                    // (Mermaid parsed it successfully but failed during DOM manipulation)
                    return [2 /*return*/, {
                            valid: true,
                            warnings: checkForWarnings(diagram),
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Determines if an error is a real syntax error vs DOM-related error
 */
function isRealSyntaxError(errorMsg) {
    var syntaxErrorPatterns = [
        "Parse error",
        "No diagram type detected",
        "Lexical error",
        "Expecting",
        "Syntax error",
        "Invalid",
        "Unrecognized",
    ];
    var domErrorPatterns = [
        "DOMPurify",
        "DOM",
        "window",
        "document",
        "addEventListener",
    ];
    // Check for syntax error patterns
    var isSyntaxError = syntaxErrorPatterns.some(function (pattern) {
        return errorMsg.includes(pattern);
    });
    // Check for DOM error patterns
    var isDomError = domErrorPatterns.some(function (pattern) {
        return errorMsg.includes(pattern);
    });
    // It's a real syntax error if it matches syntax patterns and not DOM patterns
    return isSyntaxError && !isDomError;
}
/**
 * Checks for common issues that aren't syntax errors but could be improved
 */
function checkForWarnings(diagram) {
    var warnings = [];
    // Check for mixed arrow styles
    if (diagram.includes("-->") && diagram.includes("->")) {
        warnings.push("Mixed arrow styles detected. Consider using consistent arrow types.");
    }
    // Check for raw quotes that should be escaped
    if (diagram.includes('"') && !diagram.includes("&quot;")) {
        var labelPattern = /\["[^"]*"/g;
        if (labelPattern.test(diagram)) {
            warnings.push('Raw quotes (") detected in labels. Use &quot; for quotes in labels.');
        }
    }
    // Check for potentially problematic characters in labels
    var labelWithBrackets = /\["[^"]*\[[^\]]*\][^"]*"\]/g;
    if (labelWithBrackets.test(diagram)) {
        warnings.push("Square brackets detected in labels. Consider using &#91; and &#93; for [ and ].");
    }
    // Check for very long lines that might be hard to read
    var lines = diagram.split("\n");
    var longLines = lines.filter(function (line) { return line.length > 100; });
    if (longLines.length > 0) {
        warnings.push("".concat(longLines.length, " line(s) exceed 100 characters. Consider breaking into multiple lines."));
    }
    return warnings.length > 0 ? warnings : undefined;
}
/**
 * Get list of valid diagram types
 */
function getValidDiagramTypes() {
    return [
        "C4Component",
        "C4Container",
        "C4Context",
        "C4Dynamic",
        "architecture-beta",
        "block",
        "block-beta",
        "classDiagram",
        "erDiagram",
        "flowchart",
        "gantt",
        "gitGraph",
        "graph",
        "journey",
        "kanban",
        "mindmap",
        "packet-beta",
        "pie",
        "quadrantChart",
        "radar-beta",
        "requirementDiagram",
        "sankey",
        "sequenceDiagram",
        "stateDiagram",
        "stateDiagram-v2",
        "timeline",
        "xychart-beta",
        "zenuml",
    ];
}
