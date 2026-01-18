import * as path from 'path';
import * as tl from 'azure-pipelines-task-lib/task';
import { getOpenTofuVersion, installOpenTofu, verifyInstall } from './opentofu';

async function run() {
    tl.setResourcePath(path.join(__dirname, "task.json"));
    const versionInput = tl.getInput("version") || "latest";

    try {
        const versionInfo = await getOpenTofuVersion(versionInput);
        const toolPath = await installOpenTofu(versionInfo.version, versionInfo.files);
        await verifyInstall(toolPath);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        tl.error(errorMessage);
        tl.setResult(tl.TaskResult.Failed, `Failed to install OpenTofu: ${errorMessage}`);
        return;
    }

    tl.setResult(tl.TaskResult.Succeeded, 'OpenTofu installed successfully.');
}

run();