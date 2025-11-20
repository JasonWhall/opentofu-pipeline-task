import * as tl from 'azure-pipelines-task-lib/task';
import * as tr from 'azure-pipelines-tool-lib/tool';
import * as utils from "./utils";
import * as path from 'path';
import * as fs from 'fs';

interface VersionInfo {
    id: string;
    files: string[];
}

/**
 * Gets the appropriate OpenTofu version based on user input.
 * @param version - The requested OpenTofu version (e.g., "latest" or "1.2.3").
 * @returns The resolved OpenTofu version string.
 */
export const getOpenTofuVersion = async (version: string): Promise<string> => {
    tl.debug(tl.loc("Debug_VersionRequested", version));

    const versionInfo = await getVersionInfo("https://get.opentofu.org/tofu/api.json");
    const ids = versionInfo.map(v => v.id);
    return getMatchingVersion(ids, version);
}

/**
 * Installs the specified version of OpenTofu.
 * @param version - The OpenTofu version to install.
 * @returns The path where OpenTofu is installed.
 */
export const installOpenTofu = async (version: string): Promise<string> => {
    let cachedToolPath = tr.findLocalTool("opentofu", version);

    if (cachedToolPath) {
        return cachedToolPath;
    }

    tl.debug(tl.loc("Debug_InstallingVersion", version));

    const downloadUrl = getDownloadUrl(version);
    const downloadPath = await tr.downloadToolWithRetries(downloadUrl, undefined, undefined, undefined, 5);
    const extractPath = await extractDownload(downloadPath);

    return await tr.cacheDir(extractPath, "opentofu", version);
}

/**
 * Verifies that OpenTofu is correctly installed and accessible.
 * @param toolPath - The path where OpenTofu is installed.
 * @throws Error if OpenTofu is not found or fails to execute.
 */
export const verifyInstall = async (toolPath: string): Promise<void> => {
    const tofuPath = path.join(toolPath, `tofu${utils.getFileExtension()}`);

    if (!tl.stats(tofuPath).isFile()) {
        throw new Error(tl.loc("Error_ToolNotFound", tofuPath));
    }

    fs.chmodSync(tofuPath, "777");

    if (!process.env['PATH']?.startsWith(path.dirname(tofuPath))) {
        tr.prependPath(path.dirname(tofuPath));
    }

    await tl.tool(tofuPath)
        .arg("version")
        .execAsync();
}

const getMatchingVersion = (versions: string[], requestedVersion: string): string => {
    const match = requestedVersion == "latest" 
        ? tr.evaluateVersions(versions, ">1.0.0")
        : tr.evaluateVersions(versions, requestedVersion);

    if (!match) {
        throw new Error(tl.loc("Error_VersionNotFound", requestedVersion));
    }

    return match;
}

const getVersionInfo = async (url: string): Promise<VersionInfo[]> => {
    let response;
    try {
        response = await fetch(url);
    } catch (error) {
        const errorMessage = `Failed to fetch OpenTofu version API: ${error instanceof Error ? error.message : String(error)}`;
        throw new Error(errorMessage);
    }

    if (!response.ok) {
        const errorMessage = `OpenTofu version API returned status ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
    }

    let data;
    try {
        data = await response.json();
    } catch (error) {
        const errorMessage = `Failed to parse OpenTofu version API response: ${error instanceof Error ? error.message : String(error)}`;
        throw new Error(errorMessage);
    }

    return data.versions;
}

const getDownloadUrl = (version: string) : string => 
    `https://github.com/opentofu/opentofu/releases/download/` + 
    `v${version}/tofu_${version}_${utils.getPlatform()}_${utils.getArch()}.${utils.getZipExtension()}`;

const extractDownload = async (downloadPath: string): Promise<string> => 
    utils.getPlatform().startsWith("win") 
        ? await tr.extractZip(downloadPath)
        : await tr.extractTar(downloadPath)

