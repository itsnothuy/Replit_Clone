import React from 'react';
import { buildFileTree, Directory } from "./file-manager";

/**
 * Custom hook to fetch and process file data from a CodeSandbox project.
 *
 * @param id - The unique identifier of the CodeSandbox project.
 * @param callback - A function to execute once the file tree is constructed. 
 *                   It receives the root directory (`Directory`) as an argument.
 *
 * This hook fetches the file structure of a given CodeSandbox project using its API, 
 * constructs a hierarchical file tree using `buildFileTree`, and then invokes the 
 * provided callback function with the resulting file tree. The effect runs only 
 * once when the component mounts.
 */
export const useFilesFromSandbox = (id: string, callback: (dir: Directory) => void) => {
  React.useEffect(() => {
    // Fetch file data from the CodeSandbox API for the given project ID.
    fetch('https://codesandbox.io/api/v1/sandboxes/' + id)
      .then(response => response.json()) // Parse the JSON response
      .then(({ data }) => {
        // Construct a hierarchical file tree from the fetched data
        const rootDir = buildFileTree(data);
        
        // Execute the callback function with the constructed file tree
        callback(rootDir);
      });
    
    // Note: Disabling the exhaustive-deps rule here because we want this effect
    // to run only once when the component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
