export enum Type {
    FILE, 
    DIRECTORY,
    DUMMY
}

interface CommonProps {
    id: string; // File or directory ID
    type: Type; // File type (FILE, DIRECTORY, or DUMMY)
    name: string; // Name of the file or directory
    content?: string; // Optional file content
    path: string; // Full path of the file or directory
    parentId: string | undefined; // Parent directory ID, undefined if it is the root directory
    depth: number; // Depth level in the file hierarchy
}

// Represents a file in the file tree
export interface File extends CommonProps {}


export interface RemoteFile {
    type: "file" | "dir"; // Type of the remote file: either "file" or "dir"
    name: string; // Name of the file or directory
    path: string; // Full path of the file or directory
}


export interface Directory extends CommonProps {
    files: File[]; // Array of child files within the directory
    dirs: Directory[]; // Array of child directories within the directory
}


/**
 * Constructs a hierarchical file tree from a flat array of remote file data.
 * 
 * @param data - An array of `RemoteFile` objects fetched from an external source.
 * @returns A `Directory` object representing the root of the file tree.
*/
export function buildFileTree(data: RemoteFile[]): Directory {
    const dirs = data.filter(x => x.type === "dir"); // Extract directories from the input data
    const files = data.filter(x => x.type === "file"); // Extract files from the input data
    const cache = new Map<string, Directory | File>(); // A cache to store directory and file objects by their ID (path)

    // Initialize the root directory
    let rootDir: Directory = {
        id: "root",
        name: "root",
        parentId: undefined,
        type: Type.DIRECTORY,
        path: "",
        depth: 0,
        dirs: [],
        files: []
    }

    // Create Directory objects and add them to the cache
    dirs.forEach((item) => {
        let dir: Directory = {
          id: item.path,
          name: item.name,
          path: item.path,
          parentId: item.path.split("/").length === 2 ? "0" : dirs.find(x => x.path === item.path.split("/").slice(0, -1).join("/"))?.path,
          type: Type.DIRECTORY,
          depth: 0,
          dirs: [],
          files: []
        };
        cache.set(dir.id, dir);
    });

    // Create File objects and add them to the cache
    files.forEach((item) => {
        let file: File = {
        id: item.path,
        name: item.name,
        path: item.path,
        parentId: item.path.split("/").length === 2 ? "0" : dirs.find(x => x.path === item.path.split("/").slice(0, -1).join("/"))?.path,
        type: Type.FILE,
        depth: 0
        };
        cache.set(file.id, file);
    });


    // Build the file tree by linking parent directories with their children
    cache.forEach((value) => {
        if (value.parentId === "0") {
            // Add items directly to the root directory
            if (value.type === Type.DIRECTORY) rootDir.dirs.push(value as Directory);
            else rootDir.files.push(value as File);
        } else {
            // Link items to their parent directories
            const parentDir = cache.get(value.parentId as string) as Directory;
            if (value.type === Type.DIRECTORY) parentDir.dirs.push(value as Directory);
            else parentDir.files.push(value as File);
        }
    });

    // Compute depth for all files and directories
    getDepth(rootDir, 0);

    return rootDir;
}

/**
 * Recursively calculates and assigns the depth of each file and directory.
 * 
 * @param rootDir - The root directory of the file tree.
 * @param curDepth - The current depth level in the hierarchy.
*/
function getDepth(rootDir: Directory, curDepth: number) {
    rootDir.files.forEach((file) => {
      file.depth = curDepth + 1;
    });
    rootDir.dirs.forEach((dir) => {
      dir.depth = curDepth + 1;
      getDepth(dir, curDepth + 1); // Recurse into subdirectories
    });
}


/**
 * Searches for a file by its name in the file tree.
 * 
 * @param rootDir - The root directory of the file tree.
 * @param filename - The name of the file to search for.
 * @returns The `File` object if found, otherwise `undefined`.
*/
export function findFileByName(
    rootDir: Directory,
    filename: string
): File | undefined {
    let targetFile: File | undefined = undefined;
    /**
     * Helper function to recursively search for the file.
     * 
     * @param rootDir - The current directory being searched.
     * @param filename - The name of the file to find.
    */
    function findFile(rootDir: Directory, filename: string) {
        rootDir.files.forEach((file) => {
          if (file.name === filename) {
            targetFile = file;
            return;
          }
        });
        rootDir.dirs.forEach((dir) => {
          findFile(dir, filename);
        });
    }

    findFile(rootDir, filename);
    return targetFile;
}

/**
 * Compares two directories by their names for sorting.
 * 
 * @param l - The first directory.
 * @param r - The second directory.
 * @returns A negative number if `l` comes before `r`, zero if they are equal, or a positive number if `l` comes after `r`.
*/
export function sortDir(l: Directory, r: Directory): number {
    return l.name.localeCompare(r.name);
}

/**
 * Compares two files by their names for sorting.
 * 
 * @param l - The first file.
 * @param r - The second file.
 * @returns A negative number if `l` comes before `r`, zero if they are equal, or a positive number if `l` comes after `r`.
*/
export function sortFile(l: File, r: File): number {
    return l.name.localeCompare(r.name);
}