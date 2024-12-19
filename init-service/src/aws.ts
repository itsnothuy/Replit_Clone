import { S3 } from "aws-sdk"
import fs from "fs";
import path from "path";

const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.S3_ENDPOINT
})

export async function copyS3Folder(sourcePrefix: string, destinationPrefix: string, continuationToken?: string, depth: number = 0, maxDepth: number = 10): Promise<void> {
    if (!process.env.S3_BUCKET) {
        throw new Error("S3_BUCKET environment variable is not defined. Please ensure it is set in your environment configuration.");
    }

    if (depth > maxDepth) {
        throw new Error("Maximum recursion depth exceeded while copying S3 folder.");
    }

    try {
        // List objects in the source folder
        const listParams = {
            Bucket: process.env.S3_BUCKET,
            Prefix: sourcePrefix,
            ContinuationToken: continuationToken,
        };

        const listedObjects = await s3.listObjectsV2(listParams).promise().catch(error => {
            console.error("Error listing objects in S3:", error.message || error);
            throw new Error(`Failed to list objects in S3 bucket: ${error.message || "Unknown error"}`);
        });

        if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
            console.log(`No files found in source folder: ${sourcePrefix}. List parameters:`, JSON.stringify(listParams, null, 2));
            return;
        }

        // Limit concurrency to avoid overwhelming the system
        const maxConcurrency = 10; // Adjust this based on system capability
        const chunks = [];

        for (let i = 0; i < listedObjects.Contents.length; i += maxConcurrency) {
            chunks.push(listedObjects.Contents.slice(i, i + maxConcurrency));
        }

        for (const chunk of chunks) {
            await Promise.all(
                chunk.map(async (object) => {
                    if (!object.Key) return;

                    const destinationKey = object.Key.replace(sourcePrefix, destinationPrefix);
                    const copyParams = {
                        Bucket: process.env.S3_BUCKET!,
                        CopySource: `${process.env.S3_BUCKET}/${object.Key}`,
                        Key: destinationKey,
                    };

                    await s3.copyObject(copyParams).promise();
                    console.log(`Copied ${object.Key} to ${destinationKey}`);
                })
            );
        }

        // Continue if the list is truncated
        if (listedObjects.IsTruncated) {
            await copyS3Folder(sourcePrefix, destinationPrefix, listedObjects.NextContinuationToken, depth + 1, maxDepth);
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error copying folder:", error.message);
            throw new Error(`Failed to copy folder: ${error.message}`);
        } else {
            console.error("Unknown error copying folder:", error);
            throw new Error("Failed to copy folder due to an unknown error.");
        }
    }
}

export const saveToS3 = async (key: string, filePath: string, content: string): Promise<void> => {
    const params = {
        Bucket: process.env.S3_BUCKET ?? "",
        Key: `${key}${filePath}`,
        Body: content
    }

    await s3.putObject(params).promise()
}