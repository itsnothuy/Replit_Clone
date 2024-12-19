//@ts-ignore
import { fork, IPty } from 'node-pty';
import path from "path";

const SHELL = "bash"; // Specify the shell to use for pseudo-terminals

/**
 * TerminalManager
 * 
 * Manages multiple pseudo-terminal (PTY) sessions. Provides methods to
 * create new sessions, write data to terminals, and clear sessions when done.
 */
export class TerminalManager {
    /**
     * Stores active terminal sessions.
     * Each session is keyed by an ID and contains:
     * - `terminal`: The pseudo-terminal instance (IPty object).
     * - `replId`: Associated REPL identifier.
     */
    private sessions: { [id: string]: { terminal: IPty, replId: string; } } = {};


    /**
     * Constructor initializes the session store.
     */
    constructor() {
        this.sessions = {};
    }

    /**
     * Creates a new pseudo-terminal session.
     * 
     * @param id - Unique identifier for the terminal session.
     * @param replId - Associated REPL identifier.
     * @param onData - Callback function to handle terminal output. Receives:
     *   - `data`: Terminal output as a string.
     *   - `id`: Process ID (PID) of the terminal session.
     * @returns The created pseudo-terminal instance.
     */

    createPty(id: string, replId: string, onData: (data: string, id: number) => void) {
        // Spawn a new pseudo-terminal process
        let term = fork(SHELL, [], {
            cols: 100, // Terminal width in columns
            name: 'xterm', // Terminal type emulation
            cwd: `/workspace` // Initial working directory
        });
    
        // Set up a listener to handle data output from the terminal
        term.on('data', (data: string) => onData(data, term.pid));

        // Store the session details
        this.sessions[id] = {
            terminal: term,
            replId
        };

        // Handle terminal process exit by cleaning up the session
        term.on('exit', () => {
            delete this.sessions[term.pid];
        });

        return term;
    }

    /**
     * Writes data to an active terminal session.
     * 
     * @param terminalId - The ID of the terminal session.
     * @param data - The data string to send to the terminal.
    */
    write(terminalId: string, data: string) {
        // Retrieve the terminal session and send the input data
        this.sessions[terminalId]?.terminal.write(data);
    }


    /**
     * Clears a terminal session by killing the process and removing the session.
     * 
     * @param terminalId - The ID of the terminal session to clear.
     */
    clear(terminalId: string) {
        // Kill the terminal process and delete the session
        this.sessions[terminalId]?.terminal.kill();
        delete this.sessions[terminalId];
    }
}