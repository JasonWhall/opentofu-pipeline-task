import * as tl from 'azure-pipelines-task-lib/task';
import * as tr from 'azure-pipelines-tool-lib/tool';
import * as utils from "./utils";
import * as path from 'path';
import * as fs from 'fs';

interface VersionInfo {
    id: string;
    files: string[];
}

export async function getOpenTofuVersion(): Promise<string> {
    let version = tl.getInput("version") || "latest";
    tl.debug(tl.loc("Debug_VersionRequested", version));

    const response = await fetch("https://get.opentofu.org/tofu/api.json");
    const data = await response.json();
    const versions = data.versions.map((v: VersionInfo) => v.id);

    const match = version == "latest" 
        ? tr.evaluateVersions(versions, ">1.0.0")
        : tr.evaluateVersions(versions, version);

    if (!match) {
        throw new Error(tl.loc("Error_VersionNotFound", version));
    }

    return match;
}

export async function installOpenTofu(version: string): Promise<string> {
    let cachedToolPath = tr.findLocalTool("opentofu", version);

    if (cachedToolPath) {
        return cachedToolPath;
    }

    tl.debug(tl.loc("Debug_InstallingVersion", version));

    let additionalHeaders: { [key: string]: string } = {};
    const ghToken = tl.getVariable("GITHUB_TOKEN") || utils.getGithubEndPointToken();

    if (ghToken) {
        additionalHeaders["Authorization"] = `Bearer ${ghToken}`;
    }

    const platform = utils.getPlatform();
    const arch = utils.getArch();
    const extension = platform.startsWith("win") ? "zip" : "tar.gz";

    const downloadUrl = `https://github.com/opentofu/opentofu/releases/download/v${version}/tofu_${version}_${platform}_${arch}.${extension}`;
    const downloadPath = await tr.downloadToolWithRetries(downloadUrl, undefined, undefined, additionalHeaders, 5);

    const extractPath = platform.startsWith("win")
        ? await tr.extractZip(downloadPath)
        : await tr.extractTar(downloadPath);

    cachedToolPath = await tr.cacheDir(extractPath, "opentofu", version);
    return cachedToolPath;
}

export async function verifyInstall(toolPath: string): Promise<void> {
    const tofuPath = path.join(toolPath, `tofu${utils.getPlatform().startsWith("win") ? ".exe" : ""}`);

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
