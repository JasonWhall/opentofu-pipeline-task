import * as tl from 'azure-pipelines-task-lib/task';
import { getPlatform, getArch, getZipExtension, getFileExtension } from '../utils';

// Mock the azure-pipelines-task-lib module
jest.mock('azure-pipelines-task-lib/task');

// Mock os module
jest.mock('os', () => ({
  arch: jest.fn(),
}));

import * as os from 'os';

describe('utils', () => {
  describe('getPlatform', () => {
    const mockedGetPlatform = tl.getPlatform as jest.MockedFunction<typeof tl.getPlatform>;

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return "linux" for Linux platform', () => {
      mockedGetPlatform.mockReturnValue(tl.Platform.Linux);
      expect(getPlatform()).toBe('linux');
    });

    it('should return "windows" for Windows platform', () => {
      mockedGetPlatform.mockReturnValue(tl.Platform.Windows);
      expect(getPlatform()).toBe('windows');
    });

    it('should return "darwin" for MacOS platform', () => {
      mockedGetPlatform.mockReturnValue(tl.Platform.MacOS);
      expect(getPlatform()).toBe('darwin');
    });

    it('should throw error for unsupported platform', () => {
      mockedGetPlatform.mockReturnValue(99 as any); // Unknown platform
      expect(() => getPlatform()).toThrow();
    });
  });

  describe('getArch', () => {
    const mockedArch = os.arch as jest.MockedFunction<typeof os.arch>;

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return "amd64" for x64 architecture', () => {
      mockedArch.mockReturnValue('x64');
      expect(getArch()).toBe('amd64');
    });

    it('should return "arm64" for arm64 architecture', () => {
      mockedArch.mockReturnValue('arm64');
      expect(getArch()).toBe('arm64');
    });

    it('should return "386" for ia32 architecture', () => {
      mockedArch.mockReturnValue('ia32');
      expect(getArch()).toBe('386');
    });

    it('should throw error for unsupported architecture', () => {
      mockedArch.mockReturnValue('mips' as any);
      expect(() => getArch()).toThrow();
    });
  });

  describe('getZipExtension', () => {
    const mockedGetPlatform = tl.getPlatform as jest.MockedFunction<typeof tl.getPlatform>;

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return "zip" for Windows platform', () => {
      mockedGetPlatform.mockReturnValue(tl.Platform.Windows);
      expect(getZipExtension()).toBe('zip');
    });

    it('should return "tar.gz" for Linux platform', () => {
      mockedGetPlatform.mockReturnValue(tl.Platform.Linux);
      expect(getZipExtension()).toBe('tar.gz');
    });

    it('should return "tar.gz" for MacOS platform', () => {
      mockedGetPlatform.mockReturnValue(tl.Platform.MacOS);
      expect(getZipExtension()).toBe('tar.gz');
    });
  });

  describe('getFileExtension', () => {
    const mockedGetPlatform = tl.getPlatform as jest.MockedFunction<typeof tl.getPlatform>;

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return ".exe" for Windows platform', () => {
      mockedGetPlatform.mockReturnValue(tl.Platform.Windows);
      expect(getFileExtension()).toBe('.exe');
    });

    it('should return empty string for Linux platform', () => {
      mockedGetPlatform.mockReturnValue(tl.Platform.Linux);
      expect(getFileExtension()).toBe('');
    });

    it('should return empty string for MacOS platform', () => {
      mockedGetPlatform.mockReturnValue(tl.Platform.MacOS);
      expect(getFileExtension()).toBe('');
    });
  });
});
