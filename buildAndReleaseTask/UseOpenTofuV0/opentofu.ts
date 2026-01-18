import * as tl from 'azure-pipelines-task-lib/task';
import * as tr from 'azure-pipelines-tool-lib/tool';
import * as utils from "./utils";
import * as path from 'path';
import * as fs from 'fs';

interface VersionInfo {
    id: string;
    files: string[];
}

interface ResolvedVersion {
    version: string;
    files: string[];
}

/**
 * Gets the appropriate OpenTofu version based on user input.
 * @param version - The requested OpenTofu version (e.g., "latest" or "1.2.3").
 * @returns The resolved OpenTofu version and available files for that version.
 */
export const getOpenTofuVersion = async (version: string): Promise<ResolvedVersion> => {
    tl.debug(tl.loc("Debug_VersionRequested", version));

    const versionInfo = await getVersionInfo("https://get.opentofu.org/tofu/api.json");
    const ids = versionInfo.map(v => v.id);
    const matchedVersion = getMatchingVersion(ids, version);
    
    const matchedVersionInfo = versionInfo.find(v => v.id === matchedVersion);
    if (!matchedVersionInfo) {
        throw new Error(tl.loc("Error_VersionNotFound", matchedVersion));
    }
    
    return {
        version: matchedVersion,
        files: matchedVersionInfo.files
    };
}

/**
 * Installs the specified version of OpenTofu.
 * @param version - The OpenTofu version to install.
 * @param files - Available files for this version from the API.
 * @returns The path where OpenTofu is installed.
 */
export const installOpenTofu = async (version: string, files: string[]): Promise<string> => {
    let cachedToolPath = tr.findLocalTool("opentofu", version);

    if (cachedToolPath) {
        return cachedToolPath;
    }

    tl.debug(tl.loc("Debug_InstallingVersion", version));

    const archiveFileName = getArchiveFileName(files, version, utils.getPlatform(), utils.getArch());
    const downloadUrl = getDownloadUrl(version, archiveFileName);
    const downloadPath = await tr.downloadToolWithRetries(downloadUrl, undefined, undefined, undefined, 5);
    const extractPath = await extractDownload(downloadPath, archiveFileName);

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

/**
 * Finds the appropriate archive file for the given platform and architecture.
 * Prefers .tar.gz over .zip when both are available on non-Windows platforms.
 * @param files - Array of available files for the version.
 * @param version - The specific version string used to match the filename exactly.
 * @param platform - The target platform (e.g., "linux", "darwin", "windows").
 * @param arch - The target architecture (e.g., "amd64", "arm64").
 * @returns The filename of the archive to download.
 * @throws Error if no matching file is found.
 */
const getArchiveFileName = (files: string[], version: string, platform: string, arch: string): string => {
    const base = `tofu_${version}_${platform}_${arch}`;
    const candidates = platform === 'windows'
        ? [`${base}.zip`]
        : [`${base}.tar.gz`, `${base}.zip`];

    const match = candidates.find(candidate => files.includes(candidate));
    if (!match) {
        throw new Error(tl.loc("Error_NoMatchingFile", platform, arch));
    }

    return match;
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

const getDownloadUrl = (version: string, archiveFileName: string) : string => 
    `https://github.com/opentofu/opentofu/releases/download/v${version}/${archiveFileName}`;


const extractDownload = async (downloadPath: string, archiveFileName: string): Promise<string> => 
    archiveFileName.endsWith('.zip')
        ? await tr.extractZip(downloadPath)
        : await tr.extractTar(downloadPath)
