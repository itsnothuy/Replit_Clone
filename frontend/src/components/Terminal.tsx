import { useEffect, useRef } from "react"
import { Socket } from "socket.io-client";
import { Terminal } from "xterm";
import { FitAddon } from 'xterm-addon-fit';
import { TextDecoder } from "text-encoding";




const fitAddon = new FitAddon();


/**
 * Converts an ArrayBuffer to a UTF-8 string.
 * @param buf - The ArrayBuffer to convert.
 * @returns The decoded string.
 */

// old code
// function ab2str(buf: string) {
//     return String.fromCharCode.apply(null, new Uint8Array(buf));
// }
function ab2str(buf: ArrayBuffer): string {
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(buf);
}

/** Config xterm.js terminal */
const OPTIONS_TERM = {
    useStyle: true,
    screenKeys: true,
    cursorBlink: true,
    cols: 200,
    theme: {
        background: "black"
    }
};

/**
 * TerminalComponent renders a terminal interface powered by xterm.js.
 * It communicates with a backend server using a WebSocket connection.
 *
 * @param {Object} props - Component props.
 * @param {Socket} props.socket - A socket.io client instance for communication.
 */

export const TerminalComponent = ({ socket  }: {socket: Socket}) => {
    const terminalRef = useRef<HTMLDivElement | null>(null);


    useEffect(() => {
        if (!terminalRef || !terminalRef.current || !socket) {
            return;
        }

        /**
         * Handles incoming data from the WebSocket server.
         * Converts the data (ArrayBuffer) to a string and writes it to the terminal.
         */
        const terminalHandler = ({ data }: { data: ArrayBuffer }) => {
            if (data instanceof ArrayBuffer) {
                console.error(data);
                console.log(ab2str(data))
                term.write(ab2str(data))
            }
        }

        // Request the terminal session from the server
        socket.emit("requestTerminal");

        // Listen for terminal data from the server
        socket.on("terminal", terminalHandler);


        // Initialize the terminal instance with configuration
        const term = new Terminal(OPTIONS_TERM);
        term.loadAddon(fitAddon); // Add fitAddon for responsive terminal sizing
        term.open(terminalRef.current); // Mount the terminal on the DOM element


        fitAddon.fit();

        

        // Send data typed by the user in the terminal to the server
        term.onData((data) => {
            socket.emit("terminalData", { data });
        });

        // Emit a newline character to initialize the terminal session
        socket.emit("terminalData", { data: "\n" });

        return () => {
            socket.off("terminal", terminalHandler); // Remove event listener
            term.dispose(); // Dispose of the terminal instance
        }
        
    }, [terminalRef]);

    return (
        // The container for the terminal
        <div
            style={{ width: "40vw", height: "400px", textAlign: "left" }}
            ref={terminalRef}
        >
        </div>
    );
}

