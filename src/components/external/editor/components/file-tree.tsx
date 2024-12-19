import React, { useState } from 'react';
import { Directory, File, sortDir, sortFile } from "../utils/file-manager";
import { getIcon } from "./icon";
import styled from "@emotion/styled";


// Interface defining the props for the FileTree component
interface FileTreeProps {
    rootDir: Directory;      // The root directory of the file tree
    selectedFile: File | undefined; // The currently selected file
    onSelect: (file: File) => void; // Event triggered when the selected file changes
}

// FileTree component is the root of the file tree and delegates rendering to SubTree
export const FileTree = (props: FileTreeProps) => {
    return <SubTree directory={props.rootDir} {...props} />
}


// Interface defining the props for the SubTree component
interface SubTreeProps {
    directory: Directory;      // The directory to render
    selectedFile: File | undefined; // The currently selected file
    onSelect: (file: File) => void; // Event triggered when a file is selected
}


// SubTree component recursively renders directories and files in the tree
const SubTree = (props: SubTreeProps) => {
    return (
      <div>
        {
          // Render all subdirectories, sorted by the sortDir function
          props.directory.dirs
            .sort(sortDir)
            .map(dir => (
              <React.Fragment key={dir.id}>
                <DirDiv
                  directory={dir}
                  selectedFile={props.selectedFile}
                  onSelect={props.onSelect} />
              </React.Fragment>
            ))
        }
        {
          // Render all files, sorted by the sortFile function
          props.directory.files
            .sort(sortFile)
            .map(file => (
              <React.Fragment key={file.id}>
                <FileDiv
                  file={file}
                  selectedFile={props.selectedFile}
                  onClick={() => props.onSelect(file)} />
              </React.Fragment>
            ))
        }
      </div>
    )
}
  