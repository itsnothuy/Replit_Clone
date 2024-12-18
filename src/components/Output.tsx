import { useSearchParams } from "react-router-dom";



/**
 * Output Component
 * 
 * This component dynamically displays content from a specific subdomain in an iframe. 
 * The subdomain is determined by the `replId` query parameter in the current URL.
 *
 * Functionality:
 * 1. Retrieves the `replId` query parameter from the URL using `useSearchParams` from `react-router-dom`.
 * 2. Constructs a dynamic URL (`INSTANCE_URI`) in the format `http://<replId>.autogpt-cloud.com`.
 * 3. Embeds an iframe within a `div`, displaying the content of the constructed URL.
 * 
 * Behavior:
 * - If the `replId` query parameter is missing or null, the URL defaults to an invalid subdomain (`http://.autogpt-cloud.com`).
 * - The iframe is styled to fill 100% of the width and 40% of the viewport height within its container.
 * 
 * Use Cases:
 * - Embedding dynamic application instances hosted on specific subdomains.
 * - Displaying multi-tenant content based on the `replId` parameter.
 * 
 * Considerations:
 * - Ensure the `replId` parameter is sanitized to avoid security vulnerabilities.
 * - Provide error handling for invalid or missing `replId` values.
 * - Be aware of potential performance implications for loading dynamic iframes.
 */


export const Output = () => {
    const [searchParams] = useSearchParams();
    const replId = searchParams.get('replId') ?? '';
    const INSTANCE_URI = `http://${replId}.autogpt-cloud.com`;

    return <div style={{height: "40vh", background: "white"}}>
        <iframe width={"100%"} height={"100%"} src={`${INSTANCE_URI}`} />
    </div>
}