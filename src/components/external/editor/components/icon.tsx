import React, {ReactNode} from 'react'
import {SiHtml5, SiCss3, SiJavascript, SiTypescript, SiJson} from "react-icons/si";
import {FcFolder, FcOpenedFolder, FcPicture, FcFile} from "react-icons/fc";
import {AiFillFileText} from "react-icons/ai";

/**
 * Helper function to get icons based on file extensions or directory names.
 * It uses a cache (Map) to store predefined mappings between file extensions/names and their corresponding icons.
 *
 * @returns {function(string, string): ReactNode}
 * - A function that accepts a file extension and name as arguments and returns the appropriate React icon element.
*/
function getIconHelper() {
    // Initialize a cache to store mappings between extensions/names and icons
    const cache = new Map<string, ReactNode>();

    // Populate the cache with mappings for file types
    cache.set("js", <SiJavascript color="#fbcb38" />); // JavaScript file
    cache.set("jsx", <SiJavascript color="#fbcb38" />); // React JavaScript file
    cache.set("ts", <SiTypescript color="#378baa" />); // TypeScript file
    cache.set("tsx", <SiTypescript color="#378baa" />); // React TypeScript file
    cache.set("css", <SiCss3 color="purple" />); // CSS file
    cache.set("json", <SiJson color="#5656e6" />); // JSON file
    cache.set("html", <SiHtml5 color="#e04e2c" />); // HTML file

    // Mappings for image file types
    cache.set("png", <FcPicture />); // PNG image
    cache.set("jpg", <FcPicture />); // JPG image
    cache.set("ico", <FcPicture />); // ICO image

    // Mapping for text files
    cache.set("txt", <AiFillFileText color="white" />); // Plain text file

    // Mappings for directory states
    cache.set("closedDirectory", <FcFolder />); // Closed folder
    cache.set("openDirectory", <FcOpenedFolder />); // Open folder

    // Return the function that fetches icons based on extension or name
    return function (extension: string, name: string): ReactNode {
        // Check if the cache contains a mapping for the extension
        if (cache.has(extension)) {
            return cache.get(extension);
        }
        // Check if the cache contains a mapping for the name
        else if (cache.has(name)) {
            return cache.get(name);
        }
        // Default to a generic file icon if no mapping is found
        else {
            return <FcFile />;
        }
    }
}

// Export the getIcon function for external use
export const getIcon = getIconHelper();