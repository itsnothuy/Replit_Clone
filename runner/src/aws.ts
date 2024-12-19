/**
 * This module provides utility functions for interacting with S3-compatible storage,
 * including downloading, copying, and uploading files.
 */

import { S3 } from "aws-sdk";
import fs from "fs";
import path from "path";


// Initialize the S3 client with credentials and endpoint from environment variables
const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.S3_ENDPOINT
});


/**
 * Downloads all files from a specified S3 folder to a local directory.
 *
 * @param {string} key - The S3 folder path (prefix) to download files from.
 * @param {string} localPath - The local directory to save downloaded files.
 * @returns {Promise<void>} Resolves when all files are downloaded.
 */
export const fetchS3Folder = async (key: string, localPath: string): Promise<void> => {
    const params = {
        Bucket: process.env.S3_BUCKET ?? "", // S3 bucket name
        Prefix: key                         // Folder path (prefix) in S3
    };

    // List objects in the specified folder
    const response = await s3.listObjectsV2(params).promise();
    if (response.Contents) {
        for (const file of response.Contents) {
            const fileKey = file.Key;
            if (fileKey) {
                const params = {
                    Bucket: process.env.S3_BUCKET ?? "",
                    Key: fileKey // Individual file key
                };

                // Get file content from S3
                const data = await s3.getObject(params).promise();
                if (data.Body) {
                    const fileData = data.Body;
                    // Construct the local file path
                    const filePath = `${localPath}/${fileKey.replace(key, "")}`;
                    // Write the file to the local directory
                    await writeFile(filePath, fileData as Buffer);
                }
            }
        }
    }
};


/**
 * Copies all files from one S3 folder to another within the same bucket.
 *
 * @param {string} sourcePrefix - The S3 folder path (prefix) to copy files from.
 * @param {string} destinationPrefix - The S3 folder path (prefix) to copy files to.
 * @param {string} [continuationToken] - Token for paginated responses (optional).
 * @returns {Promise<void>} Resolves when all files are copied.
 */
export async function copyS3Folder(sourcePrefix: string, destinationPrefix: string, continuationToken?: string): Promise<void> {
    try {
        // List all objects in the source folder
        const listParams = {
            Bucket: process.env.S3_BUCKET ?? "",
            Prefix: sourcePrefix,
            ContinuationToken: continuationToken
        };

        const listedObjects = await s3.listObjectsV2(listParams).promise();

         // Exit if no objects are found
        if (!listedObjects.Contents || listedObjects.Contents.length === 0) return;

        // Copy each object
        for (const object of listedObjects.Contents) {
            if (!object.Key) continue;
            const destinationKey = object.Key.replace(sourcePrefix, destinationPrefix); // Construct destination key

            const copyParams = {
                Bucket: process.env.S3_BUCKET ?? "",
                CopySource: `${process.env.S3_BUCKET}/${object.Key}`, // Source object path
                Key: destinationKey // Destination object path
            };

            console.log(copyParams); // Log copy parameters
            await s3.copyObject(copyParams).promise(); // Perform copy operation
            console.log(`Copied ${object.Key} to ${destinationKey}`); // Log success
        }

        // Handle pagination if the response is truncated
        if (listedObjects.IsTruncated) {
            await copyS3Folder(sourcePrefix, destinationPrefix, listedObjects.NextContinuationToken);
        }
    } catch (error) {
        console.error('Error copying folder:', error); // Log errors
    }
}

/**
 * Writes a file to the local file system, ensuring the folder structure exists.
 *
 * @param {string} filePath - The full path where the file should be saved.
 * @param {Buffer} fileData - The file content to write.
 * @returns {Promise<void>} Resolves when the file is written.
 */
function writeFile(filePath: string, fileData: Buffer): Promise<void> {
    return new Promise(async (resolve, reject) => {
        // Ensure the folder structure exists
        await createFolder(path.dirname(filePath));

        // Write the file to the specified path
        fs.writeFile(filePath, fileData, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Creates a folder and its parent directories if they do not exist.
 *
 * @param {string} dirName - The directory path to create.
 * @returns {Promise<void>} Resolves when the folder is created.
 */
function createFolder(dirName: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        // Create the directory recursively
        fs.mkdir(dirName, { recursive: true }, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

/**
 * Uploads a file to S3 at the specified key.
 *
 * @param {string} key - The S3 folder path (prefix) for the file.
 * @param {string} filePath - The local file path (used in constructing the S3 key).
 * @param {string} content - The file content to upload.
 * @returns {Promise<void>} Resolves when the file is uploaded.
 */
export const saveToS3 = async (key: string, filePath: string, content: string): Promise<void> => {
    const params = {
        Bucket: process.env.S3_BUCKET ?? "", // S3 bucket name
        Key: `${key}${filePath}`,          // Construct the full S3 key
        Body: content                      // File content
    };

    // Upload the file to S3
    await s3.putObject(params).promise();
};