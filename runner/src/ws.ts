import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import path from "path";
import { saveToS3 } from "./aws"; // Custom function to save data to AWS S3
import { fetchDir, fetchFileContent, saveFile } from "./fs"; // File system utilities for directory and file operations
import { TerminalManager } from "./pty"; // Terminal manager for handling PTY (pseudo-terminal) sessions


// Initialize an instance of TerminalManager for managing PTY sessions
const terminalManager = new TerminalManager();


/**
 * Initializes the WebSocket server and attaches it to the provided HTTP server.
 * 
 * @param {HttpServer} httpServer - The HTTP server to bind the WebSocket server to.
 */
export function initWs(httpServer: HttpServer) {
    const io = new Server(httpServer, {
        cors: {
            // Allow connections from any origin with GET and POST methods
            // Note: This should be restricted to trusted origins in production!
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    // Event listener for client connections
    io.on("connection", async (socket) => {
        // Extract host information from the WebSocket handshake
        const host = socket.handshake.headers.host;
        console.log(`host is ${host}`);

        // Parse the subdomain as the `replId` (unique workspace identifier)
        const replId = host?.split('.')[0];

        // Disconnect the client if `replId` is invalid
        if (!replId) {
            socket.disconnect();
            terminalManager.clear(socket.id); // Clear terminal session if any
            return;
        }

        // Send the root directory contents to the client after connection
        socket.emit("loaded", {
            rootContent: await fetchDir("/workspace", "") // Fetch workspace directory
        });

        // Initialize event handlers for this connection
        initHandlers(socket, replId);
    });
}


/**
 * Registers event handlers for a WebSocket connection.
 * 
 * @param {Socket} socket - The WebSocket connection instance.
 * @param {string} replId - Unique identifier for the client's workspace.
 */
function initHandlers(socket: Socket, replId: string) {
    // Handle client disconnection
    socket.on("disconnect", () => {
        console.log("user disconnected");
    });

    /**
     * Fetch directory contents based on the provided path.
     * 
     * @param {string} dir - The relative directory path to fetch.
     * @param {function} callback - Callback function to return directory contents.
     */
    socket.on("fetchDir", async (dir: string, callback) => {
        const dirPath = `/workspace/${dir}`;
        const contents = await fetchDir(dirPath, dir); // Fetch directory contents
        callback(contents); // Send data back to the client
    });


    /**
     * Fetch the content of a specific file.
     * 
     * @param {Object} params - Object containing the file path.
     * @param {string} params.path - The relative path to the file.
     * @param {function} callback - Callback function to return file content.
     */
    socket.on("fetchContent", async ({ path: filePath }: { path: string }, callback) => {
        const fullPath = `/workspace/${filePath}`;
        const data = await fetchFileContent(fullPath); // Fetch file content
        callback(data); // Send file content back to the client
    });


    /**
     * Update the content of a specific file and sync it to AWS S3.
     * 
     * @param {Object} params - Object containing file path and content.
     * @param {string} params.path - The relative path to the file.
     * @param {string} params.content - The new content for the file.
     */
    socket.on("updateContent", async ({ path: filePath, content }: { path: string, content: string }) => {
        const fullPath =  `/workspace/${filePath}`;
        await saveFile(fullPath, content); // Save the updated content locally
        await saveToS3(`code/${replId}`, filePath, content); // Sync to AWS S3
    });


    /**
     * Create a new terminal session for the client.
     */
    socket.on("requestTerminal", async () => {
        terminalManager.createPty(socket.id, replId, (data, id) => {
            // Emit terminal data back to the client
            socket.emit('terminal', {
                data: Buffer.from(data, "utf-8") // Encode data as Buffer
            });
        });
    });


    /**
     * Handle input data for the terminal session.
     * 
     * @param {Object} params - Object containing terminal data.
     * @param {string} params.data - Input data for the terminal.
     */
    socket.on("terminalData", async ({ data }: { data: string }) => {
        terminalManager.write(socket.id, data); // Write input to terminal session
    });
}

