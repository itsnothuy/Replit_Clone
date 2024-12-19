import { useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';
import { Editor } from './Editor';
import { File, RemoteFile, Type } from './external/editor/utils/file-manager';
import { useSearchParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { Output } from './Output';
import { TerminalComponent as Terminal } from './Terminal';
import axios from 'axios';

/**
 * Custom hook to initialize and manage a WebSocket connection.
 * @param replId - Unique identifier for the current coding session
 * @returns The WebSocket instance
*/
function useSocket(replId: string) {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
            if (replId) {
            // Create a new WebSocket connection
            const newSocket = io(`ws://${replId}.peetcode.com`);
            setSocket(newSocket);

            // Cleanup function to disconnect the WebSocket on unmount
            return () => {
                newSocket.disconnect();
            };
        }
    }, [replId]);

    return socket;
}

// Styled components for layout
const Container = styled.div
`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ButtonContainer = styled.div
`
  display: flex;
  justify-content: flex-end; /* Aligns children (button) to the right */
  padding: 10px; /* Adds some space around the button */
`;

const Workspace = styled.div
`
  display: flex;
  margin: 0;
  font-size: 16px;
  width: 100%;
`;

const LeftPanel = styled.div
`
  flex: 1;
  width: 60%;
`;

const RightPanel = styled.div
`
  flex: 1;
  width: 40%;
`;


/**
 * Main component for the coding page.
 * Initializes the backend pod and manages its state.
 * Displays a booting message until the pod is ready. 
*/
export const CodingPage = () => {
    const [podCreated, setPodCreated] = useState(false); // Tracks pod creation status
    const [searchParams] = useSearchParams(); // Access URL query parameters
    const replId = searchParams.get('replId') ?? ''; // Get the `replId` from the URL

    useEffect(() => {
        if (replId) {
            // Send a POST request to start the backend pod for the session
            axios.post(`http://localhost:3002/start`, { replId })
                .then(() => setPodCreated(true)) // Set pod as created on success
                .catch((err) => console.error(err)); // Log errors if the request fails
        }
    }, [replId]);

    if (!podCreated) {
        // Show booting message until the pod is created
        return <>Booting...</>
    }

    // Render the post-pod-creation coding environment
    return <CodingPagePostPodCreation />;
}

/**
 * Component rendered after the backend pod is created.
 * Handles file management, WebSocket interaction, and UI rendering.
*/
export const CodingPagePostPodCreation = () => {
    const [searchParams] = useSearchParams(); // Access URL query parameters
    const replId = searchParams.get('replId') ?? ''; // Get the `replId` from the URL
    const [loaded, setLoaded] = useState(false); // Tracks whether the file structure is loaded
    const socket = useSocket(replId); // Initialize WebSocket connection using the custom hook
    const [fileStructure, setFileStructure] = useState<RemoteFile[]>([]); // Stores file hierarchy
    const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined); // Tracks the selected file
    const [showOutput, setShowOutput] = useState(false); // Toggles output visibility

    useEffect(() => {
        if (socket) {
            // Listen for the `loaded` event from the server to fetch the file structure
            socket.on('loaded', ({ rootContent }: { rootContent: RemoteFile[] }) => {
                setLoaded(true); // Mark the structure as loaded
                setFileStructure(rootContent); // Update the file structure state
            });
        }
    }, [socket]);

    /**
     * Handles file or directory selection.
     * @param file - The selected file or directory
    */
    const onSelect = (file: File) => {
        if (file.type === Type.DIRECTORY) {
            // Fetch directory contents from the server
            socket?.emit("fetchDir", file.path, (data: RemoteFile[]) => {
                setFileStructure(prev => {
                    // Merge new directory contents with existing file structure
                    const allFiles = [...prev, ...data];
                    return allFiles.filter((file, index, self) => 
                        index === self.findIndex(f => f.path === file.path)
                    );
                });
            });
        } else {
            // Fetch file content from the server
            socket?.emit("fetchContent", { path: file.path }, (data: string) => {
                file.content = data; // Update the file's content
                setSelectedFile(file); // Mark the file as selected
            });
        }
    };


    if (!loaded) {
        // Show loading message until the file structure is loaded
        return "Loading...";
    }


    // Render the coding environment UI
    return (
        <Container>
            {/* Button to toggle output visibility */}
            <ButtonContainer>
                <button onClick={() => setShowOutput(!showOutput)}>See output</button>
            </ButtonContainer>
            <Workspace>
                {/* Left panel: Displays the editor with the file structure */}
                <LeftPanel>
                    {socket && (
                        <Editor
                            socket={socket}
                            selectedFile={selectedFile}
                            onSelect={onSelect}
                            files={fileStructure}
                        />
                    )}
                </LeftPanel>
                {/* Right panel: Displays output and terminal */}
                <RightPanel>
                    {showOutput && <Output />} {/* Conditionally render the output */}
                    {socket && <Terminal socket={socket}/>}  {/* Terminal for command-line interaction */}
                </RightPanel>
            </Workspace>
        </Container>
    );
}


