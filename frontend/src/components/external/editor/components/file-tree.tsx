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

const FileDiv = ({ file, icon, selectedFile, onClick }: {
    file: File | Directory; // The file or directory to render
    icon?: string;          // Optional icon to display
    selectedFile: File | undefined; // The currently selected file
    onClick: () => void;    // Event triggered when the file is clicked
}) => {
    const isSelected = (selectedFile && selectedFile.id === file.id) as boolean; // Check if this file is selected
    const depth = file.depth; // Indentation level based on file depth in the tree
    return (
      <Div
        depth={depth}
        isSelected={isSelected}
        onClick={onClick}>
        <FileIcon
          name={icon}
          extension={file.name.split('.').pop() || ""} />
        <span style={{ marginLeft: 1 }}>
          {file.name}
        </span>
      </Div>
    )
}

// Styled component for individual file or directory entries
const Div = styled.div<{
    depth: number;          // Depth of the file/directory in the tree
    isSelected: boolean;    // Whether the file/directory is selected
}>
`
    display: flex;
    align-items: center;
    padding-left: ${props => props.depth * 16}px; // Indent based on depth
    background-color: ${props => props.isSelected ? "#242424" : "transparent"}; // Highlight if selected
  
    :hover {
      cursor: pointer;
      background-color: #242424; // Highlight on hover
    }
`

// DirDiv renders a directory and manages its open/closed state
const DirDiv = ({ directory, selectedFile, onSelect }: {
    directory: Directory; // The directory to render
    selectedFile: File | undefined; // The currently selected file
    onSelect: (file: File) => void; // Event triggered when a directory is clicked
}) => {
    // Check if the directory should be open initially (if it contains the selected file)
    let defaultOpen = false;
    if (selectedFile)
      defaultOpen = isChildSelected(directory, selectedFile);
    
    const [open, setOpen] = useState(defaultOpen); // State to track if the directory is expanded
  
    return (
      <>
        <FileDiv
          file={directory}
          icon={open ? "openDirectory" : "closedDirectory"} // Toggle icon based on open state
          selectedFile={selectedFile}
          onClick={() => {
            if (!open) {
              onSelect(directory); // Trigger selection when opened
            }
            setOpen(!open); // Toggle open state
          }} />
        {
          // Recursively render the directory's contents if open
          open ? (
            <SubTree
              directory={directory}
              selectedFile={selectedFile}
              onSelect={onSelect} />
          ) : null
        }
      </>
    )
}

// Utility function to check if a directory contains the currently selected file
const isChildSelected = (directory: Directory, selectedFile: File) => {
    let res: boolean = false;
  
    // Recursive helper function to traverse the directory tree
    function isChild(dir: Directory, file: File) {
      if (selectedFile.parentId === dir.id) {
        res = true; // The selected file is a direct child of this directory
        return;
      }
      if (selectedFile.parentId === '0') {
        res = false; // Base case: root directory
        return;
      }
      dir.dirs.forEach((item) => {
        isChild(item, file); // Check subdirectories
      });
    }
  
    isChild(directory, selectedFile);
    return res;
}

// FileIcon renders an icon for a file or directory based on its type or name
const FileIcon = ({ extension, name }: { name?: string, extension?: string }) => {
    let icon = getIcon(extension || "", name || ""); // Determine icon based on extension or name
    return (
      <Span>
        {icon}
      </Span>
    )
}

// Styled component for the file/directory icon
const Span = styled.span
`
  display: flex;
  width: 32px;
  height: 32px;
  justify-content: center;
  align-items: center;
`