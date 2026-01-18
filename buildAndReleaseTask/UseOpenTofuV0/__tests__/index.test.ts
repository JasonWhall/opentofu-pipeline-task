// Mock all dependencies
jest.mock('azure-pipelines-task-lib/task');
jest.mock('../opentofu');

import * as tl from 'azure-pipelines-task-lib/task';
import * as opentofu from '../opentofu';

// Import the module under test after mocks are set up
// This will execute the run() function
const runModule = () => {
  jest.isolateModules(() => {
    require('../index');
  });
};

describe('index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (tl.setResourcePath as jest.Mock).mockImplementation(() => {});
    (tl.getInput as jest.Mock).mockReturnValue(null);
    (tl.setResult as jest.Mock).mockImplementation(() => {});
    (tl.error as jest.Mock).mockImplementation(() => {});
  });

  describe('run function', () => {
    it('should successfully install OpenTofu with default version', async () => {
      const mockVersion = '1.10.2';
      const mockFiles = ['tofu_1.10.2_linux_amd64.tar.gz'];
      const mockToolPath = '/path/to/opentofu';

      (tl.getInput as jest.Mock).mockReturnValue(null); // No version specified
      (opentofu.getOpenTofuVersion as jest.Mock).mockResolvedValue({ version: mockVersion, files: mockFiles });
      (opentofu.installOpenTofu as jest.Mock).mockResolvedValue(mockToolPath);
      (opentofu.verifyInstall as jest.Mock).mockResolvedValue(undefined);

      runModule();

      // Wait for async operations to complete
      await new Promise(process.nextTick);

      expect(tl.setResourcePath).toHaveBeenCalledWith(expect.stringContaining('task.json'));
      expect(tl.getInput).toHaveBeenCalledWith('version');
      expect(opentofu.getOpenTofuVersion).toHaveBeenCalledWith('latest');
      expect(opentofu.installOpenTofu).toHaveBeenCalledWith(mockVersion, mockFiles);
      expect(opentofu.verifyInstall).toHaveBeenCalledWith(mockToolPath);
      expect(tl.setResult).toHaveBeenCalledWith(
        tl.TaskResult.Succeeded,
        'OpenTofu installed successfully.'
      );
    });

    it('should successfully install OpenTofu with specific version', async () => {
      const mockVersion = '1.9.5';
      const mockFiles = ['tofu_1.9.5_linux_amd64.tar.gz'];
      const mockToolPath = '/path/to/opentofu';

      (tl.getInput as jest.Mock).mockReturnValue('1.9.5');
      (opentofu.getOpenTofuVersion as jest.Mock).mockResolvedValue({ version: mockVersion, files: mockFiles });
      (opentofu.installOpenTofu as jest.Mock).mockResolvedValue(mockToolPath);
      (opentofu.verifyInstall as jest.Mock).mockResolvedValue(undefined);

      runModule();

      await new Promise(process.nextTick);

      expect(opentofu.getOpenTofuVersion).toHaveBeenCalledWith('1.9.5');
      expect(opentofu.installOpenTofu).toHaveBeenCalledWith(mockVersion, mockFiles);
      expect(opentofu.verifyInstall).toHaveBeenCalledWith(mockToolPath);
      expect(tl.setResult).toHaveBeenCalledWith(
        tl.TaskResult.Succeeded,
        'OpenTofu installed successfully.'
      );
    });

    it('should handle Error instance and set task as failed', async () => {
      const errorMessage = 'Failed to fetch version';
      const error = new Error(errorMessage);

      (tl.getInput as jest.Mock).mockReturnValue('latest');
      (opentofu.getOpenTofuVersion as jest.Mock).mockRejectedValue(error);

      runModule();

      await new Promise(process.nextTick);

      expect(tl.error).toHaveBeenCalledWith(errorMessage);
      expect(tl.setResult).toHaveBeenCalledWith(
        tl.TaskResult.Failed,
        `Failed to install OpenTofu: ${errorMessage}`
      );
    });

    it('should handle string error and set task as failed', async () => {
      const errorMessage = 'Something went wrong';

      (tl.getInput as jest.Mock).mockReturnValue('latest');
      (opentofu.getOpenTofuVersion as jest.Mock).mockRejectedValue(errorMessage);

      runModule();

      await new Promise(process.nextTick);

      expect(tl.error).toHaveBeenCalledWith(errorMessage);
      expect(tl.setResult).toHaveBeenCalledWith(
        tl.TaskResult.Failed,
        `Failed to install OpenTofu: ${errorMessage}`
      );
    });

    it('should handle error during installation', async () => {
      const mockVersion = '1.10.2';
      const mockFiles = ['tofu_1.10.2_linux_amd64.tar.gz'];
      const errorMessage = 'Download failed';
      const error = new Error(errorMessage);

      (tl.getInput as jest.Mock).mockReturnValue('latest');
      (opentofu.getOpenTofuVersion as jest.Mock).mockResolvedValue({ version: mockVersion, files: mockFiles });
      (opentofu.installOpenTofu as jest.Mock).mockRejectedValue(error);

      runModule();

      await new Promise(process.nextTick);

      expect(tl.error).toHaveBeenCalledWith(errorMessage);
      expect(tl.setResult).toHaveBeenCalledWith(
        tl.TaskResult.Failed,
        `Failed to install OpenTofu: ${errorMessage}`
      );
    });

    it('should handle error during verification', async () => {
      const mockVersion = '1.10.2';
      const mockFiles = ['tofu_1.10.2_linux_amd64.tar.gz'];
      const mockToolPath = '/path/to/opentofu';
      const errorMessage = 'Tool not found';
      const error = new Error(errorMessage);

      (tl.getInput as jest.Mock).mockReturnValue('latest');
      (opentofu.getOpenTofuVersion as jest.Mock).mockResolvedValue({ version: mockVersion, files: mockFiles });
      (opentofu.installOpenTofu as jest.Mock).mockResolvedValue(mockToolPath);
      (opentofu.verifyInstall as jest.Mock).mockRejectedValue(error);

      runModule();

      await new Promise(process.nextTick);

      expect(tl.error).toHaveBeenCalledWith(errorMessage);
      expect(tl.setResult).toHaveBeenCalledWith(
        tl.TaskResult.Failed,
        `Failed to install OpenTofu: ${errorMessage}`
      );
    });

    it('should use empty string as version when getInput returns empty string', async () => {
      const mockVersion = '1.10.2';
      const mockFiles = ['tofu_1.10.2_linux_amd64.tar.gz'];
      const mockToolPath = '/path/to/opentofu';

      (tl.getInput as jest.Mock).mockReturnValue('');
      (opentofu.getOpenTofuVersion as jest.Mock).mockResolvedValue({ version: mockVersion, files: mockFiles });
      (opentofu.installOpenTofu as jest.Mock).mockResolvedValue(mockToolPath);
      (opentofu.verifyInstall as jest.Mock).mockResolvedValue(undefined);

      runModule();

      await new Promise(process.nextTick);

      expect(opentofu.getOpenTofuVersion).toHaveBeenCalledWith('latest');
    });
  });
});

