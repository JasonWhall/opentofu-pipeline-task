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

export function getGithubEndPointToken(): string | undefined {
    const githubEndpoint = tl.getInput("gitHubConnection", false);

    if (!githubEndpoint) {
        tl.debug(tl.loc("Debug_NoGitHubConnection"));
        return undefined;
    }

    const githubEndpointObject = tl.getEndpointAuthorization(githubEndpoint, true);
    let githubEndpointToken: string | undefined;

    switch (githubEndpointObject?.scheme) {
        case 'PersonalAccessToken':
        case 'Token':
        case 'OAuth':
            githubEndpointToken = githubEndpointObject.parameters.accessToken;
            break;
        default:
            throw new Error(tl.loc("Error_InvalidGitHubConnection", githubEndpointObject?.scheme));
    }

    return githubEndpointToken;
}
