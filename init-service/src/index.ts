import express, { RequestHandler } from "express";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
import { copyS3Folder } from "./aws";

const app = express();
app.use(express.json());
app.use(cors());

// Define the expected structure of the request body
interface ProjectRequestBody {
    replId: string;
    language: string;
}

// Explicitly define the handler
const projectHandler: RequestHandler<{}, {}, ProjectRequestBody> = async (req, res) => {
    const { replId, language } = req.body;

    if (!replId || !language) {
        res.status(400).send("Bad request: Missing replId or language");
        return; // Ensure the function does not proceed further
    }

    try {
        await copyS3Folder(`base/${language}`, `code/${replId}`);
        res.status(200).send("Project created successfully");
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).send("Failed to create project. Please check the logs.");
    }
};

// Use the handler in the route
app.post("/project", projectHandler);

const port = process.env.PORT || 3001;

app.listen(port, () => {
    console.log(`listening on *:${port}`);
});
