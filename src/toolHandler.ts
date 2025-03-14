import { Browser, Page, chromium, request } from 'playwright';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { BROWSER_TOOLS, API_TOOLS } from './tools.js';
import { ToolContext } from './tools/common/types.js';
import { 
  ScreenshotTool,
  NavigationTool,
  CloseBrowserTool,
  ConsoleLogsTool
} from './tools/browser/index.js';
import {
  ClickTool,
  IframeClickTool,
  FillTool,
  SelectTool,
  HoverTool,
  EvaluateTool
} from './tools/browser/interaction.js';
import {
  GetRequestTool,
  PostRequestTool,
  PutRequestTool,
  PatchRequestTool,
  DeleteRequestTool
} from './tools/api/requests.js';

// Global state
let browser: Browser | undefined;
let page: Page | undefined;

// Tool instances
let screenshotTool: ScreenshotTool;
let navigationTool: NavigationTool;
let closeBrowserTool: CloseBrowserTool;
let consoleLogsTool: ConsoleLogsTool;
let clickTool: ClickTool;
let iframeClickTool: IframeClickTool;
let fillTool: FillTool;
let selectTool: SelectTool;
let hoverTool: HoverTool;
let evaluateTool: EvaluateTool;
let getRequestTool: GetRequestTool;
let postRequestTool: PostRequestTool;
let putRequestTool: PutRequestTool;
let patchRequestTool: PatchRequestTool;
let deleteRequestTool: DeleteRequestTool;

/**
 * Ensures a browser is launched and returns the page
 */
async function ensureBrowser(viewport?: { width?: number; height?: number }) {
  if (!browser) {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
      viewport: {
        width: viewport?.width ?? 1280,
        height: viewport?.height ?? 720,
      },
      deviceScaleFactor: 1,
    });

    page = await context.newPage();

    // Register console message handler
    page.on("console", (msg) => {
      if (consoleLogsTool) {
        consoleLogsTool.registerConsoleMessage(msg.type(), msg.text());
      }
    });
  }
  return page!;
}

/**
 * Creates a new API request context
 */
async function ensureApiContext(url: string) {
  return await request.newContext({
    baseURL: url,
  });
}

/**
 * Initialize all tool instances
 */
function initializeTools(server: any) {
  // Browser tools
  if (!screenshotTool) screenshotTool = new ScreenshotTool(server);
  if (!navigationTool) navigationTool = new NavigationTool(server);
  if (!closeBrowserTool) closeBrowserTool = new CloseBrowserTool(server);
  if (!consoleLogsTool) consoleLogsTool = new ConsoleLogsTool(server);
  if (!clickTool) clickTool = new ClickTool(server);
  if (!iframeClickTool) iframeClickTool = new IframeClickTool(server);
  if (!fillTool) fillTool = new FillTool(server);
  if (!selectTool) selectTool = new SelectTool(server);
  if (!hoverTool) hoverTool = new HoverTool(server);
  if (!evaluateTool) evaluateTool = new EvaluateTool(server);
  
  // API tools
  if (!getRequestTool) getRequestTool = new GetRequestTool(server);
  if (!postRequestTool) postRequestTool = new PostRequestTool(server);
  if (!putRequestTool) putRequestTool = new PutRequestTool(server);
  if (!patchRequestTool) patchRequestTool = new PatchRequestTool(server);
  if (!deleteRequestTool) deleteRequestTool = new DeleteRequestTool(server);
}

/**
 * Main handler for tool calls
 */
export async function handleToolCall(
  name: string,
  args: any,
  server: any
): Promise<CallToolResult> {
  // Initialize tools
  initializeTools(server);

  // Prepare context based on tool requirements
  const context: ToolContext = {
    server
  };
  
  // Set up browser if needed
  if (BROWSER_TOOLS.includes(name)) {
    context.page = await ensureBrowser({
      width: args.width,
      height: args.height
    });
    context.browser = browser;
  }

  // Set up API context if needed
  if (API_TOOLS.includes(name)) {
    context.apiContext = await ensureApiContext(args.url);
  }

  // Route to appropriate tool
  switch (name) {
    // Browser tools
    case "playwright_navigate":
      return await navigationTool.execute(args, context);
      
    case "playwright_screenshot":
      return await screenshotTool.execute(args, context);
      
    case "playwright_close":
      return await closeBrowserTool.execute(args, context);
      
    case "playwright_console_logs":
      return await consoleLogsTool.execute(args, context);
      
    case "playwright_click":
      return await clickTool.execute(args, context);
      
    case "playwright_iframe_click":
      return await iframeClickTool.execute(args, context);
      
    case "playwright_fill":
      return await fillTool.execute(args, context);
      
    case "playwright_select":
      return await selectTool.execute(args, context);
      
    case "playwright_hover":
      return await hoverTool.execute(args, context);
      
    case "playwright_evaluate":
      return await evaluateTool.execute(args, context);
      
    // API tools
    case "playwright_get":
      return await getRequestTool.execute(args, context);
      
    case "playwright_post":
      return await postRequestTool.execute(args, context);
      
    case "playwright_put":
      return await putRequestTool.execute(args, context);
      
    case "playwright_patch":
      return await patchRequestTool.execute(args, context);
      
    case "playwright_delete":
      return await deleteRequestTool.execute(args, context);
    
    default:
      return {
        content: [{
          type: "text",
          text: `Unknown tool: ${name}`,
        }],
        isError: true,
      };
  }
}

/**
 * Get console logs
 */
export function getConsoleLogs(): string[] {
  return consoleLogsTool?.getConsoleLogs() ?? [];
}

/**
 * Get screenshots
 */
export function getScreenshots(): Map<string, string> {
  return screenshotTool?.getScreenshots() ?? new Map();
} 