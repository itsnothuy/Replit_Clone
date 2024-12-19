import { useEffect, useMemo, useState } from "react";
import Sidebar from "./external/editor/components/Sidebar";
import { Code } from "./external/editor/editor/code";
import styled from "@emotion/styled";
import { File, buildFileTree, RemoteFile } from "./external/editor/utils/file-manager";
import { FileTree } from "./external/editor/components/file-tree";
import { Socket } from "socket.io-client";

/**
 * Editor Component
 *
 * This component renders an integrated file editor with a file tree for navigation and
 * a code editing area. It supports real-time collaboration via Socket.io.
 *
 * Props:
 * - `files` (RemoteFile[]): List of remote files to display in the file tree.
 * - `onSelect` (function): Callback function triggered when a file is selected.
 * - `selectedFile` (File | undefined): The currently selected file in the editor.
 * - `socket` (Socket): A socket instance for real-time updates and collaboration.
 *
 * Usage:
 * ```jsx
 * <Editor
 *   files={fileList}
 *   onSelect={handleFileSelect}
 *   selectedFile={currentFile}
 *   socket={socketInstance}
 * />
 * ```
*/


export const Editor = ({
    files,
    onSelect,
    selectedFile,
    socket,
}: {
    files: RemoteFile[];
    onSelect: (file: File) => void;
    selectedFile: File | undefined;
    socket: Socket;
}) => {
    /**
     * Memoized File Tree
     *
     * Converts the flat file list (`files`) into a hierarchical file tree.
     * This is recomputed only when `files` changes.
     *
     * Example Output:
     * {
     *   name: "root",
     *   files: [
     *     { name: "file1.js", type: "file" },
     *     { name: "folder", type: "directory", files: [{ name: "nested.js", type: "file" }] }
     *   ]
     * }
    */
    const rootDir = useMemo(() => {
        return buildFileTree(files);
    }, [files]);
    

    /**
     * Default File Selection
     *
     * Ensures a file is always selected by default. If no file is currently selected,
     * the first file in the file tree is selected automatically.
     *
     * Dependencies:
     * - Runs whenever `selectedFile` changes.
    */
    useEffect(() => {
        if (!selectedFile) {
          onSelect(rootDir.files[0]);
        }
    }, [selectedFile]);
    
    /**
     * Render the Editor
     *
     * The layout consists of:
     * - A sidebar containing the file tree for navigation.
     * - A code editor displaying the content of the selected file.
    */
    return (
        <div>
          <Main>
            {/* Sidebar for File Tree Navigation */}
            <Sidebar>
              <FileTree
                rootDir={rootDir}
                selectedFile={selectedFile}
                onSelect={onSelect}
              />
            </Sidebar>
    
            {/* Code Editor for File Content */}
            <Code socket={socket} selectedFile={selectedFile} />
          </Main>
        </div>
    );
};

/**
 * Styled Components
 *
 * `Main` is a flex container to layout the file tree and code editor horizontally.
*/
const Main = styled.main
`
  display: flex;
`;