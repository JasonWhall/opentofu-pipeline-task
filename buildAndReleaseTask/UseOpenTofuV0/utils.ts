import * as tl from "azure-pipelines-task-lib/task";
import os from "os";

export function getPlatform(): string {
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

export function getArch(): string {
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