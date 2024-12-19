import fs from "fs";

interface File {
    type: "file" | "dir"; // Specifies whether the entry is a file or directory
    name: string;         // The name of the file or directory
    path: string;         // Full path of the file or directory
}

/**
 * Fetches the list of files and directories in a given directory.
 * @param {string} dir - The directory to read.
 * @param {string} baseDir - The base directory to prepend to the file/directory names for full paths.
 * @returns {Promise<File[]>} - A promise that resolves to an array of objects representing the contents of the directory.
 *                              Each object contains the type ("file" or "dir"), name, and path of the entry.
 */
export const fetchDir = (dir: string, baseDir: string): Promise<File[]> => {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, { withFileTypes: true }, (err, files) => {
            if (err) {
                // Reject the promise if an error occurs while reading the directory
                reject(err);
            } else {
                // Map each directory entry to a File object and resolve the promise
                resolve(
                    files.map(file => ({
                        type: file.isDirectory() ? "dir" : "file", // Determine if the entry is a directory or file
                        name: file.name,                           // The name of the entry
                        path: `${baseDir}/${file.name}`            // Construct the full path
                    }))
                );
            }
        });
    });
};

/**
 * Reads the content of a specified file.
 * @param {string} file - The file path to read.
 * @returns {Promise<string>} - A promise that resolves to the content of the file as a UTF-8 encoded string.
 */
export const fetchFileContent = (file: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        fs.readFile(file, "utf8", (err, data) => {
            if (err) {
                // Reject the promise if an error occurs while reading the file
                reject(err);
            } else {
                // Resolve the promise with the file content
                resolve(data);
            }
        });
    });
};


/**
 * Writes content to a specified file.
 * @param {string} file - The file path where the content should be saved.
 * @param {string} content - The content to write to the file.
 * @returns {Promise<void>} - A promise that resolves when the file is successfully written, or rejects if an error occurs.
 */
export const saveFile = async (file: string, content: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        fs.writeFile(file, content, "utf8", (err) => {
            if (err) {
                // Reject the promise if an error occurs while writing to the file
                reject(err);
            } else {
                // Resolve the promise once the file is successfully written
                resolve();
            }
        });
    });
};
