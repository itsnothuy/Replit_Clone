import Editor from "@monaco-editor/react";
import { File } from "../utils/file-manager";
import { Socket } from "socket.io-client";



/**
 * A React component for editing a file using the Monaco Editor.
 * Sends updates to a server via WebSocket for real-time collaboration.
 *
 * @param {Object} props - The props for the component.
 * @param {File | undefined} props.selectedFile - The file to be displayed and edited in the editor. If undefined, the component renders nothing.
 * @param {Socket} props.socket - The WebSocket connection used to send file updates to the server.
 * @returns {JSX.Element | null} The rendered editor component or null if no file is selected.
 */

export const Code = ({selectedFile, socket }: { selectedFile: File | undefined, socket: Socket }) => {
    if (!selectedFile) {
        return null;
    }

    const code = selectedFile.content;
    // let language = selectedFile.name.split('.').pop();

    // // Map specific file extensions to Monaco Editor-supported languages.
    // if (language === "js" || language === "jsx")
    //     language = "javascript";
    //   else if (language === "ts" || language === "tsx")
    //     language = "typescript"
    //   else if (language === "py" )
    //     language = "python"
    
    const languageMap: { [key: string]: string } = {
        js: "javascript",
        jsx: "javascript",
        ts: "typescript",
        tsx: "typescript",
        py: "python",
      };
    const language = languageMap[selectedFile.name.split('.').pop()!] || "plaintext";

    /**
     * Creates a debounced version of a function.
     * Ensures the function is called only after a specified delay has passed
     * since the last invocation.
     *
     * @param {function} func - The function to debounce.
     * @param {number} wait - The debounce delay in milliseconds.
     * @returns {function} A debounced version of the input function.
   */
    function debounce(func: (value: string | undefined) => void, wait: number): (value: string | undefined) => void {
        let timeout: number;
        return (value: string | undefined) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func(value);
            }, wait);
        };
    }

    return (
        <Editor
            height="100vh"
            language={language}
            value={code}
            theme="vs-dark"
            onChange={debounce((value) => {
                // Should send diffs, for now sending the whole file
                // PR and win a bounty!

                // Check if value is defined before sending the update to the server.
                if (value !== undefined) {
                    // Ensure value is not undefined before using it
                    socket.emit("updateContent", {
                      path: selectedFile.path, // The file's path for identification.
                      content: value, // The updated file content.
                    });
                  }
            }, 500)} // Debounce the update to reduce the frequency of server calls.
        />
    )

}