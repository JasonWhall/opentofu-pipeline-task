import * as path from 'path';
import * as tl from 'azure-pipelines-task-lib/task';
import { getOpenTofuVersion, installOpenTofu, VerifyInstall } from './opentofu';

async function run() {
    tl.setResourcePath(path.join(__dirname, "task.json"));

    try {
        const version = await getOpenTofuVersion();
        var toolPath = await installOpenTofu(version);
        await VerifyInstall(toolPath);
    }
    catch (error) {
        console.error(error);
        tl.setResult(tl.TaskResult.Failed, `Failed to install OpenTofu: ${error}`);
        return;
    }

    tl.setResult(tl.TaskResult.Succeeded, 'OpenTofu installed successfully.');
}

run();