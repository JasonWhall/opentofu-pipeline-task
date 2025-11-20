
// Mock all dependencies
jest.mock('azure-pipelines-task-lib/task');
jest.mock('azure-pipelines-tool-lib/tool');
jest.mock('fs');
jest.mock('../utils');

import * as tl from 'azure-pipelines-task-lib/task';
import * as tr from 'azure-pipelines-tool-lib/tool';
import * as path from 'path';
import * as fs from 'fs';
import { getOpenTofuVersion, installOpenTofu, verifyInstall } from '../opentofu';
import * as utils from '../utils';

// Mock global fetch
global.fetch = jest.fn();

describe('opentofu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOpenTofuVersion', () => {
    const mockVersionData = {
      versions: [
        { id: '1.10.2', files: [] },
        { id: '1.10.1', files: [] },
        { id: '1.9.0', files: [] },
        { id: '1.8.5', files: [] },
      ],
    };

    it('should fetch and return the latest version', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockVersionData,
      });

      (tr.evaluateVersions as jest.Mock).mockReturnValue('1.10.2');
      (tl.debug as jest.Mock).mockImplementation(() => {});
      (tl.loc as jest.Mock).mockImplementation((key: string, value: string) => `${key}: ${value}`);

      const version = await getOpenTofuVersion('latest');

      expect(version).toBe('1.10.2');
      expect(global.fetch).toHaveBeenCalledWith('https://get.opentofu.org/tofu/api.json');
      expect(tr.evaluateVersions).toHaveBeenCalledWith(
        ['1.10.2', '1.10.1', '1.9.0', '1.8.5'],
        '>1.0.0'
      );
    });

    it('should fetch and return a specific version', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockVersionData,
      });

      (tr.evaluateVersions as jest.Mock).mockReturnValue('1.9.0');
      (tl.debug as jest.Mock).mockImplementation(() => {});
      (tl.loc as jest.Mock).mockImplementation((key: string, value: string) => `${key}: ${value}`);

      const version = await getOpenTofuVersion('1.9.0');

      expect(version).toBe('1.9.0');
      expect(tr.evaluateVersions).toHaveBeenCalledWith(
        ['1.10.2', '1.10.1', '1.9.0', '1.8.5'],
        '1.9.0'
      );
    });

    it('should throw error when version is not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockVersionData,
      });

      (tr.evaluateVersions as jest.Mock).mockReturnValue(null);
      (tl.debug as jest.Mock).mockImplementation(() => {});
      (tl.loc as jest.Mock).mockImplementation((key: string) => key);

      await expect(getOpenTofuVersion('99.99.99')).rejects.toThrow();
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      (tl.debug as jest.Mock).mockImplementation(() => {});
      (tl.loc as jest.Mock).mockImplementation((key: string) => key);

      await expect(getOpenTofuVersion('latest')).rejects.toThrow('Failed to fetch OpenTofu version API');
    });

    it('should throw error when API returns non-ok status', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });
      (tl.debug as jest.Mock).mockImplementation(() => {});
      (tl.loc as jest.Mock).mockImplementation((key: string) => key);

      await expect(getOpenTofuVersion('latest')).rejects.toThrow('OpenTofu version API returned status 404');
    });

    it('should throw error when JSON parsing fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });
      (tl.debug as jest.Mock).mockImplementation(() => {});
      (tl.loc as jest.Mock).mockImplementation((key: string) => key);

      await expect(getOpenTofuVersion('latest')).rejects.toThrow('Failed to parse OpenTofu version API response');
    });
  });

  describe('installOpenTofu', () => {
    const mockVersion = '1.10.2';
    const mockCachePath = '/path/to/cache';
    const mockDownloadPath = '/path/to/download';
    const mockExtractPath = '/path/to/extract';

    beforeEach(() => {
      (tl.debug as jest.Mock).mockImplementation(() => {});
      (tl.loc as jest.Mock).mockImplementation((key: string, value: string) => `${key}: ${value}`);
      (utils.getPlatform as jest.Mock).mockReturnValue('linux');
      (utils.getArch as jest.Mock).mockReturnValue('amd64');
      (utils.getZipExtension as jest.Mock).mockReturnValue('tar.gz');
    });

    it('should return cached tool path if already installed', async () => {
      (tr.findLocalTool as jest.Mock).mockReturnValue(mockCachePath);

      const result = await installOpenTofu(mockVersion);

      expect(result).toBe(mockCachePath);
      expect(tr.findLocalTool).toHaveBeenCalledWith('opentofu', mockVersion);
      expect(tr.downloadToolWithRetries).not.toHaveBeenCalled();
    });

    it('should download, extract, and cache tool if not cached', async () => {
      (tr.findLocalTool as jest.Mock).mockReturnValue('');
      (tr.downloadToolWithRetries as jest.Mock).mockResolvedValue(mockDownloadPath);
      (tr.extractTar as jest.Mock).mockResolvedValue(mockExtractPath);
      (tr.cacheDir as jest.Mock).mockResolvedValue(mockCachePath);

      const result = await installOpenTofu(mockVersion);

      expect(result).toBe(mockCachePath);
      expect(tr.downloadToolWithRetries).toHaveBeenCalledWith(
        `https://github.com/opentofu/opentofu/releases/download/v${mockVersion}/tofu_${mockVersion}_linux_amd64.tar.gz`,
        undefined,
        undefined,
        undefined,
        5
      );
      expect(tr.extractTar).toHaveBeenCalledWith(mockDownloadPath);
      expect(tr.cacheDir).toHaveBeenCalledWith(mockExtractPath, 'opentofu', mockVersion);
    });

    it('should use extractZip for Windows platform', async () => {
      (tr.findLocalTool as jest.Mock).mockReturnValue('');
      (tr.downloadToolWithRetries as jest.Mock).mockResolvedValue(mockDownloadPath);
      (tr.extractZip as jest.Mock).mockResolvedValue(mockExtractPath);
      (tr.cacheDir as jest.Mock).mockResolvedValue(mockCachePath);
      (utils.getPlatform as jest.Mock).mockReturnValue('windows');
      (utils.getZipExtension as jest.Mock).mockReturnValue('zip');

      await installOpenTofu(mockVersion);

      expect(tr.extractZip).toHaveBeenCalledWith(mockDownloadPath);
      expect(tr.extractTar).not.toHaveBeenCalled();
    });
  });

  describe('verifyInstall', () => {
    const mockToolPath = '/path/to/tool';
    const mockTofuPath = path.join(mockToolPath, 'tofu');

    beforeEach(() => {
      (tl.loc as jest.Mock).mockImplementation((key: string) => key);
      (utils.getFileExtension as jest.Mock).mockReturnValue('');
    });

    it('should verify installation and add to PATH', async () => {
      const mockStats = { isFile: () => true };
      (tl.stats as jest.Mock).mockReturnValue(mockStats);
      (fs.chmodSync as jest.Mock).mockImplementation(() => {});
      (tr.prependPath as jest.Mock).mockImplementation(() => {});

      const mockTool = {
        arg: jest.fn().mockReturnThis(),
        execAsync: jest.fn().mockResolvedValue(0),
      };
      (tl.tool as jest.Mock).mockReturnValue(mockTool);

      process.env['PATH'] = '/some/other/path';

      await verifyInstall(mockToolPath);

      expect(tl.stats).toHaveBeenCalledWith(mockTofuPath);
      expect(fs.chmodSync).toHaveBeenCalledWith(mockTofuPath, '777');
      expect(tr.prependPath).toHaveBeenCalledWith(path.dirname(mockTofuPath));
      expect(mockTool.arg).toHaveBeenCalledWith('version');
      expect(mockTool.execAsync).toHaveBeenCalled();
    });

    it('should verify installation with .exe extension on Windows', async () => {
      const mockTofuPathExe = path.join(mockToolPath, 'tofu.exe');
      const mockStats = { isFile: () => true };
      (tl.stats as jest.Mock).mockReturnValue(mockStats);
      (fs.chmodSync as jest.Mock).mockImplementation(() => {});
      (tr.prependPath as jest.Mock).mockImplementation(() => {});
      (utils.getFileExtension as jest.Mock).mockReturnValue('.exe');

      const mockTool = {
        arg: jest.fn().mockReturnThis(),
        execAsync: jest.fn().mockResolvedValue(0),
      };
      (tl.tool as jest.Mock).mockReturnValue(mockTool);

      process.env['PATH'] = '/some/other/path';

      await verifyInstall(mockToolPath);

      expect(tl.stats).toHaveBeenCalledWith(mockTofuPathExe);
    });

    it('should throw error if tool is not found', async () => {
      const mockStats = { isFile: () => false };
      (tl.stats as jest.Mock).mockReturnValue(mockStats);

      await expect(verifyInstall(mockToolPath)).rejects.toThrow();
    });

    it('should not prepend PATH if already in PATH', async () => {
      const mockStats = { isFile: () => true };
      (tl.stats as jest.Mock).mockReturnValue(mockStats);
      (fs.chmodSync as jest.Mock).mockImplementation(() => {});
      (tr.prependPath as jest.Mock).mockImplementation(() => {});

      const mockTool = {
        arg: jest.fn().mockReturnThis(),
        execAsync: jest.fn().mockResolvedValue(0),
      };
      (tl.tool as jest.Mock).mockReturnValue(mockTool);

      process.env['PATH'] = path.dirname(mockTofuPath) + ':/some/other/path';

      await verifyInstall(mockToolPath);

      expect(tr.prependPath).not.toHaveBeenCalled();
    });
  });
});
