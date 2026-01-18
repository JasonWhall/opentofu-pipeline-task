import * as tl from "azure-pipelines-task-lib/task";
import os from "os";

/**
 * 
 * @returns The platform string used in OpenTofu download URLs.
 * @throws Error if the OS is unsupported.
 */
export const getPlatform = (): string => {
    const platform = tl.getPlatform();

    switch (platform) {
        case tl.Platform.Linux:
            return `linux`;
        case tl.Platform.Windows:
            return `windows`;
        case tl.Platform.MacOS:
            return `darwin`;
        default:
            throw new Error(tl.loc("Unsupported_OS"));
   }
}

/**
 * 
 * @returns The architecture string used in OpenTofu download URLs.
 * @throws Error if the architecture is unsupported.
 */
export const getArch = (): string => {
    const arch = os.arch();

    switch (arch) {
        case "x64":
            return "amd64";
        case "arm64":
            return "arm64";
        case "ia32":
            return "386";
        default:
            throw new Error(tl.loc("Unsupported_Arch", arch));
    }
}


/** 
 * 
 * @returns The appropriate executable file extension for the current platform.
 */
export const getFileExtension = (): string => getPlatform().startsWith("win") ? ".exe" : "";