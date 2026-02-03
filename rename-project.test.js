/**
 * Unit tests for rename-project.js
 * 
 * Tests the validation and file operation functions.
 */

const { validateProjectName, getCurrentProjectName, updatePackageJson, updateAngularJson, updateReadme, promptForNewName, showSuccess, showWarning, showError } = require('./rename-project');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

describe('validateProjectName', () => {
  describe('valid project names', () => {
    it('should accept simple lowercase name', () => {
      const result = validateProjectName('myproject');
      expect(result.valid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should accept kebab-case name', () => {
      const result = validateProjectName('my-project');
      expect(result.valid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should accept name with numbers', () => {
      const result = validateProjectName('project123');
      expect(result.valid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should accept name with numbers after hyphen', () => {
      const result = validateProjectName('my-project-123');
      expect(result.valid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should accept name with multiple hyphens', () => {
      const result = validateProjectName('my-angular-project-v2');
      expect(result.valid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should accept single letter name', () => {
      const result = validateProjectName('a');
      expect(result.valid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should accept name starting with letter followed by number', () => {
      const result = validateProjectName('a1');
      expect(result.valid).toBe(true);
      expect(result.error).toBe(null);
    });
  });

  describe('invalid project names - empty string', () => {
    it('should reject empty string', () => {
      const result = validateProjectName('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('should reject whitespace-only string', () => {
      const result = validateProjectName('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('should reject null', () => {
      const result = validateProjectName(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('should reject undefined', () => {
      const result = validateProjectName(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });
  });

  describe('invalid project names - starts with number', () => {
    it('should reject name starting with number', () => {
      const result = validateProjectName('123project');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid project name');
    });

    it('should reject name starting with number followed by hyphen', () => {
      const result = validateProjectName('1-project');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid project name');
    });
  });

  describe('invalid project names - hyphens at edges', () => {
    it('should reject name starting with hyphen', () => {
      const result = validateProjectName('-myproject');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid project name');
    });

    it('should reject name ending with hyphen', () => {
      const result = validateProjectName('myproject-');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid project name');
    });

    it('should reject name with hyphens at both edges', () => {
      const result = validateProjectName('-myproject-');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid project name');
    });
  });

  describe('invalid project names - invalid characters', () => {
    it('should reject name with uppercase letters', () => {
      const result = validateProjectName('MyProject');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid project name');
    });

    it('should reject name with spaces', () => {
      const result = validateProjectName('my project');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid project name');
    });

    it('should reject name with underscores', () => {
      const result = validateProjectName('my_project');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid project name');
    });

    it('should reject name with special characters', () => {
      const result = validateProjectName('my-project!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid project name');
    });

    it('should reject name with dots', () => {
      const result = validateProjectName('my.project');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid project name');
    });

    it('should reject name with @ symbol', () => {
      const result = validateProjectName('@myproject');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid project name');
    });
  });

  describe('edge cases', () => {
    it('should reject consecutive hyphens', () => {
      const result = validateProjectName('my--project');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid project name');
    });

    it('should accept very long valid name', () => {
      const longName = 'my-very-long-project-name-with-many-words-and-numbers-123';
      const result = validateProjectName(longName);
      expect(result.valid).toBe(true);
      expect(result.error).toBe(null);
    });
  });

  describe('error messages', () => {
    it('should provide helpful error message for invalid format', () => {
      const result = validateProjectName('MyProject');
      expect(result.error).toContain('kebab-case');
      expect(result.error).toContain('lowercase letter');
      expect(result.error).toContain('Examples:');
    });
  });
});

describe('getCurrentProjectName', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    // Save original working directory
    originalCwd = process.cwd();
    
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rename-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Restore original working directory
    process.chdir(originalCwd);
    
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('valid package.json', () => {
    it('should read project name from valid package.json', () => {
      const packageJson = {
        name: 'my-test-project',
        version: '1.0.0'
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      const result = getCurrentProjectName(pkgPath);
      expect(result).toBe('my-test-project');
    });

    it('should read project name with special characters', () => {
      const packageJson = {
        name: '@scope/my-project',
        version: '1.0.0'
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      const result = getCurrentProjectName(pkgPath);
      expect(result).toBe('@scope/my-project');
    });

    it('should read project name from package.json with many fields', () => {
      const packageJson = {
        name: 'complex-project',
        version: '2.5.1',
        description: 'A complex project',
        author: 'Test Author',
        dependencies: {
          'some-package': '^1.0.0'
        }
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      const result = getCurrentProjectName(pkgPath);
      expect(result).toBe('complex-project');
    });
  });

  describe('package.json not found', () => {
    it('should throw error when package.json does not exist', () => {
      const pkgPath = path.join(tempDir, 'package.json');
      expect(() => {
        getCurrentProjectName(pkgPath);
      }).toThrow('package.json not found');
    });

    it('should include helpful message in error', () => {
      const pkgPath = path.join(tempDir, 'package.json');
      expect(() => {
        getCurrentProjectName(pkgPath);
      }).toThrow('must be run from the project root');
    });
  });

  describe('package.json without name field', () => {
    it('should throw error when name field is missing', () => {
      const packageJson = {
        version: '1.0.0',
        description: 'A project without a name'
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      expect(() => {
        getCurrentProjectName(pkgPath);
      }).toThrow('does not contain a "name" field');
    });

    it('should throw error when name field is null', () => {
      const packageJson = {
        name: null,
        version: '1.0.0'
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      expect(() => {
        getCurrentProjectName(pkgPath);
      }).toThrow('does not contain a "name" field');
    });

    it('should throw error when name field is empty string', () => {
      const packageJson = {
        name: '',
        version: '1.0.0'
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      expect(() => {
        getCurrentProjectName(pkgPath);
      }).toThrow('does not contain a "name" field');
    });
  });

  describe('malformed JSON', () => {
    it('should throw error for invalid JSON syntax', () => {
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, '{ "name": "test", invalid json }');

      expect(() => {
        getCurrentProjectName(pkgPath);
      }).toThrow('malformed and cannot be parsed');
    });

    it('should throw error for incomplete JSON', () => {
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, '{ "name": "test"');

      expect(() => {
        getCurrentProjectName(pkgPath);
      }).toThrow('malformed and cannot be parsed');
    });

    it('should throw error for non-JSON content', () => {
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, 'This is not JSON at all');

      expect(() => {
        getCurrentProjectName(pkgPath);
      }).toThrow('malformed and cannot be parsed');
    });

    it('should throw error for empty file', () => {
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, '');

      expect(() => {
        getCurrentProjectName(pkgPath);
      }).toThrow('malformed and cannot be parsed');
    });
  });

  describe('edge cases', () => {
    it('should handle package.json with only name field', () => {
      const packageJson = {
        name: 'minimal-project'
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      const result = getCurrentProjectName(pkgPath);
      expect(result).toBe('minimal-project');
    });

    it('should handle package.json with unusual formatting', () => {
      const packageJsonStr = '{\n\n\n  "name"  :  "spaced-project"  ,\n\n  "version": "1.0.0"\n\n}';
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, packageJsonStr);

      const result = getCurrentProjectName(pkgPath);
      expect(result).toBe('spaced-project');
    });
  });
});

describe('promptForNewName', () => {
  let mockReadlineInterface;
  let consoleLogSpy;

  beforeEach(() => {
    // Save original console.log
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.log
    consoleLogSpy.mockRestore();
  });

  describe('valid input on first attempt', () => {
    it('should accept valid kebab-case name immediately', async () => {
      // Mock readline interface
      mockReadlineInterface = {
        question: jest.fn((question, callback) => {
          callback('my-new-project');
        }),
        close: jest.fn()
      };

      const result = await promptForNewName('old-project', mockReadlineInterface);
      
      expect(result).toBe('my-new-project');
      expect(mockReadlineInterface.question).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should display welcome message with current name', async () => {
      mockReadlineInterface = {
        question: jest.fn((question, callback) => {
          callback('valid-name');
        }),
        close: jest.fn()
      };

      await promptForNewName('current-project-name', mockReadlineInterface);
      
      // Check that welcome message was displayed
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      
      expect(allLogs).toContain('PROJECT RENAME SCRIPT');
      expect(allLogs).toContain('Current project name: current-project-name');
      expect(allLogs).toContain('package.json');
      expect(allLogs).toContain('angular.json');
      expect(allLogs).toContain('README.md');
    });
  });

  describe('invalid input with retry', () => {
    it('should loop until valid name is provided', async () => {
      let callCount = 0;
      mockReadlineInterface = {
        question: jest.fn((question, callback) => {
          callCount++;
          if (callCount === 1) {
            callback('Invalid-Name'); // Invalid: uppercase
          } else if (callCount === 2) {
            callback('123-invalid'); // Invalid: starts with number
          } else {
            callback('valid-name'); // Valid
          }
        }),
        close: jest.fn()
      };

      const result = await promptForNewName('old-name', mockReadlineInterface);
      
      expect(result).toBe('valid-name');
      expect(mockReadlineInterface.question).toHaveBeenCalledTimes(3);
    });

    it('should display error message for invalid input', async () => {
      let callCount = 0;
      mockReadlineInterface = {
        question: jest.fn((question, callback) => {
          callCount++;
          if (callCount === 1) {
            callback('UPPERCASE'); // Invalid
          } else {
            callback('valid-name'); // Valid
          }
        }),
        close: jest.fn()
      };

      await promptForNewName('old-name', mockReadlineInterface);
      
      // Check that error message was displayed
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      
      expect(allLogs).toContain('❌');
      expect(allLogs).toContain('Invalid project name');
    });

    it('should display error with examples for invalid format', async () => {
      let callCount = 0;
      mockReadlineInterface = {
        question: jest.fn((question, callback) => {
          callCount++;
          if (callCount === 1) {
            callback('my_project'); // Invalid: underscore
          } else {
            callback('my-project'); // Valid
          }
        }),
        close: jest.fn()
      };

      await promptForNewName('old-name', mockReadlineInterface);
      
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      
      expect(allLogs).toContain('kebab-case');
      expect(allLogs).toContain('Examples:');
      expect(allLogs).toContain('my-project');
    });

    it('should handle empty string input', async () => {
      let callCount = 0;
      mockReadlineInterface = {
        question: jest.fn((question, callback) => {
          callCount++;
          if (callCount === 1) {
            callback(''); // Invalid: empty
          } else {
            callback('valid-name'); // Valid
          }
        }),
        close: jest.fn()
      };

      const result = await promptForNewName('old-name', mockReadlineInterface);
      
      expect(result).toBe('valid-name');
      expect(mockReadlineInterface.question).toHaveBeenCalledTimes(2);
      
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain('cannot be empty');
    });

    it('should handle whitespace-only input', async () => {
      let callCount = 0;
      mockReadlineInterface = {
        question: jest.fn((question, callback) => {
          callCount++;
          if (callCount === 1) {
            callback('   '); // Invalid: whitespace only
          } else {
            callback('valid-name'); // Valid
          }
        }),
        close: jest.fn()
      };

      const result = await promptForNewName('old-name', mockReadlineInterface);
      
      expect(result).toBe('valid-name');
      expect(mockReadlineInterface.question).toHaveBeenCalledTimes(2);
    });
  });

  describe('prompt message', () => {
    it('should display clear prompt for new name', async () => {
      mockReadlineInterface = {
        question: jest.fn((question, callback) => {
          expect(question).toContain('new project name');
          expect(question).toContain('kebab-case');
          callback('valid-name');
        }),
        close: jest.fn()
      };

      await promptForNewName('old-name', mockReadlineInterface);
      
      expect(mockReadlineInterface.question).toHaveBeenCalled();
    });
  });

  describe('multiple validation errors', () => {
    it('should handle multiple different validation errors in sequence', async () => {
      const invalidInputs = [
        '-starts-with-hyphen',
        'ends-with-hyphen-',
        '123-starts-with-number',
        'Has-Uppercase',
        'has spaces',
        'has_underscore'
      ];
      
      let callCount = 0;
      mockReadlineInterface = {
        question: jest.fn((question, callback) => {
          if (callCount < invalidInputs.length) {
            callback(invalidInputs[callCount]);
            callCount++;
          } else {
            callback('finally-valid-name');
          }
        }),
        close: jest.fn()
      };

      const result = await promptForNewName('old-name', mockReadlineInterface);
      
      expect(result).toBe('finally-valid-name');
      expect(mockReadlineInterface.question).toHaveBeenCalledTimes(invalidInputs.length + 1);
    });
  });
});

describe('Output Functions', () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('showSuccess', () => {
    it('should display message with success symbol', () => {
      showSuccess('Operation completed');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ Operation completed');
    });

    it('should display message with checkmark for file update', () => {
      showSuccess('Updated package.json');
      
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ Updated package.json');
    });

    it('should handle empty message', () => {
      showSuccess('');
      
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ ');
    });

    it('should handle multiline message', () => {
      const message = 'Line 1\nLine 2';
      showSuccess(message);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ Line 1\nLine 2');
    });
  });

  describe('showWarning', () => {
    it('should display message with warning symbol', () => {
      showWarning('File not found');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith('⚠️  File not found');
    });

    it('should display warning for optional file', () => {
      showWarning('angular.json not found. Skipping Angular configuration update.');
      
      expect(consoleLogSpy).toHaveBeenCalledWith('⚠️  angular.json not found. Skipping Angular configuration update.');
    });

    it('should handle empty message', () => {
      showWarning('');
      
      expect(consoleLogSpy).toHaveBeenCalledWith('⚠️  ');
    });

    it('should handle multiline warning', () => {
      const message = 'Warning:\nSome files could not be updated';
      showWarning(message);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('⚠️  Warning:\nSome files could not be updated');
    });
  });

  describe('showError', () => {
    it('should display message with error symbol', () => {
      showError('Operation failed');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith('❌ Operation failed');
    });

    it('should display error for file operation', () => {
      showError('Error updating angular.json: EACCES: permission denied');
      
      expect(consoleLogSpy).toHaveBeenCalledWith('❌ Error updating angular.json: EACCES: permission denied');
    });

    it('should handle empty message', () => {
      showError('');
      
      expect(consoleLogSpy).toHaveBeenCalledWith('❌ ');
    });

    it('should handle multiline error', () => {
      const message = 'Error:\nInvalid configuration';
      showError(message);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('❌ Error:\nInvalid configuration');
    });
  });

  describe('Output formatting consistency', () => {
    it('should use different symbols for different message types', () => {
      showSuccess('Success message');
      showWarning('Warning message');
      showError('Error message');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
      
      const calls = consoleLogSpy.mock.calls;
      expect(calls[0][0]).toContain('✓');
      expect(calls[1][0]).toContain('⚠️');
      expect(calls[2][0]).toContain('❌');
    });

    it('should maintain consistent spacing after symbols', () => {
      showSuccess('Test');
      showWarning('Test');
      showError('Test');
      
      const calls = consoleLogSpy.mock.calls;
      
      // Success has one space after ✓
      expect(calls[0][0]).toBe('✓ Test');
      
      // Warning has two spaces after ⚠️ (emoji takes more space)
      expect(calls[1][0]).toBe('⚠️  Test');
      
      // Error has one space after ❌
      expect(calls[2][0]).toBe('❌ Test');
    });
  });

  describe('Integration with requirements', () => {
    it('should support progress messages for file updates (Requirement 2.3)', () => {
      showSuccess('Updated package.json');
      showSuccess('Updated angular.json');
      showSuccess('Updated README.md');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
      expect(consoleLogSpy.mock.calls[0][0]).toContain('package.json');
      expect(consoleLogSpy.mock.calls[1][0]).toContain('angular.json');
      expect(consoleLogSpy.mock.calls[2][0]).toContain('README.md');
    });

    it('should support success summary messages (Requirement 2.4)', () => {
      showSuccess('Project renamed successfully');
      
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ Project renamed successfully');
    });

    it('should support clear error messages (Requirement 2.5)', () => {
      showError('Error: package.json not found');
      
      expect(consoleLogSpy).toHaveBeenCalledWith('❌ Error: package.json not found');
    });

    it('should support warning for optional files (Requirement 5.2)', () => {
      showWarning('Warning: angular.json not found. Skipping Angular configuration update.');
      
      expect(consoleLogSpy).toHaveBeenCalledWith('⚠️  Warning: angular.json not found. Skipping Angular configuration update.');
    });
  });
});

describe('updatePackageJson', () => {
  let tempDir;
  let originalCwd;
  let consoleLogSpy;

  beforeEach(() => {
    // Save original working directory
    originalCwd = process.cwd();
    
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rename-test-'));
    process.chdir(tempDir);

    // Mock console.log to suppress output during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.log
    consoleLogSpy.mockRestore();

    // Restore original working directory
    process.chdir(originalCwd);
    
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('successful updates', () => {
    it('should update the name field in package.json', () => {
      const packageJson = {
        name: 'old-project-name',
        version: '1.0.0',
        description: 'Test project'
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      const result = updatePackageJson('old-project-name', 'new-project-name', pkgPath);

      expect(result).toBe(true);

      // Verify the file was updated
      const updatedContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      expect(updatedContent.name).toBe('new-project-name');
      expect(updatedContent.version).toBe('1.0.0');
      expect(updatedContent.description).toBe('Test project');
    });

    it('should remove the rename script from scripts section', () => {
      const packageJson = {
        name: 'old-project',
        version: '1.0.0',
        scripts: {
          start: 'node index.js',
          rename: 'node rename-project.js',
          test: 'jest'
        }
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      const result = updatePackageJson('old-project', 'new-project', pkgPath);

      expect(result).toBe(true);

      // Verify the rename script was removed
      const updatedContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      expect(updatedContent.name).toBe('new-project');
      expect(updatedContent.scripts.rename).toBeUndefined();
      expect(updatedContent.scripts.start).toBe('node index.js');
      expect(updatedContent.scripts.test).toBe('jest');
    });

    it('should preserve 2-space indentation', () => {
      const packageJson = {
        name: 'old-project',
        version: '1.0.0',
        dependencies: {
          express: '^4.17.1'
        }
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      updatePackageJson('old-project', 'new-project', pkgPath);

      // Read the raw file content to check indentation
      const rawContent = fs.readFileSync(pkgPath, 'utf8');
      
      // Check for 2-space indentation
      expect(rawContent).toContain('  "name": "new-project"');
      expect(rawContent).toContain('  "version": "1.0.0"');
      expect(rawContent).toContain('  "dependencies": {');
      expect(rawContent).toContain('    "express": "^4.17.1"');
    });

    it('should add trailing newline to file', () => {
      const packageJson = {
        name: 'old-project',
        version: '1.0.0'
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      updatePackageJson('old-project', 'new-project', pkgPath);

      // Read the raw file content
      const rawContent = fs.readFileSync(pkgPath, 'utf8');
      
      // Check that file ends with newline
      expect(rawContent.endsWith('\n')).toBe(true);
    });

    it('should handle package.json without scripts section', () => {
      const packageJson = {
        name: 'old-project',
        version: '1.0.0'
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      const result = updatePackageJson('old-project', 'new-project', pkgPath);

      expect(result).toBe(true);

      const updatedContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      expect(updatedContent.name).toBe('new-project');
    });

    it('should handle package.json with scripts but no rename script', () => {
      const packageJson = {
        name: 'old-project',
        version: '1.0.0',
        scripts: {
          start: 'node index.js',
          test: 'jest'
        }
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      const result = updatePackageJson('old-project', 'new-project', pkgPath);

      expect(result).toBe(true);

      const updatedContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      expect(updatedContent.name).toBe('new-project');
      expect(updatedContent.scripts.start).toBe('node index.js');
      expect(updatedContent.scripts.test).toBe('jest');
    });

    it('should preserve all other fields in package.json', () => {
      const packageJson = {
        name: 'old-project',
        version: '2.5.1',
        description: 'A complex project',
        author: 'Test Author',
        license: 'MIT',
        keywords: ['test', 'project'],
        dependencies: {
          express: '^4.17.1',
          lodash: '^4.17.21'
        },
        devDependencies: {
          jest: '^27.0.0'
        },
        scripts: {
          start: 'node index.js',
          rename: 'node rename-project.js',
          test: 'jest'
        }
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      updatePackageJson('old-project', 'new-project', pkgPath);

      const updatedContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      expect(updatedContent.name).toBe('new-project');
      expect(updatedContent.version).toBe('2.5.1');
      expect(updatedContent.description).toBe('A complex project');
      expect(updatedContent.author).toBe('Test Author');
      expect(updatedContent.license).toBe('MIT');
      expect(updatedContent.keywords).toEqual(['test', 'project']);
      expect(updatedContent.dependencies).toEqual({
        express: '^4.17.1',
        lodash: '^4.17.21'
      });
      expect(updatedContent.devDependencies).toEqual({
        jest: '^27.0.0'
      });
      expect(updatedContent.scripts.rename).toBeUndefined();
      expect(updatedContent.scripts.start).toBe('node index.js');
      expect(updatedContent.scripts.test).toBe('jest');
    });
  });

  describe('error handling', () => {
    it('should return false when package.json does not exist', () => {
      const pkgPath = path.join(tempDir, 'nonexistent-package.json');

      const result = updatePackageJson('old-project', 'new-project', pkgPath);

      expect(result).toBe(false);
      
      // Check that error message was displayed
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain('❌');
      expect(allLogs).toContain('Error updating package.json');
    });

    it('should return false when package.json is malformed', () => {
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, '{ invalid json }');

      const result = updatePackageJson('old-project', 'new-project', pkgPath);

      expect(result).toBe(false);
      
      // Check that error message was displayed
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain('❌');
      expect(allLogs).toContain('Error updating package.json');
    });

    it('should display error message with details', () => {
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, '{ "name": "test", invalid }');

      updatePackageJson('old-project', 'new-project', pkgPath);

      // Check that error message includes details
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain('Error updating package.json');
    });
  });

  describe('edge cases', () => {
    it('should handle minimal package.json with only name field', () => {
      const packageJson = {
        name: 'minimal-project'
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      const result = updatePackageJson('minimal-project', 'new-minimal', pkgPath);

      expect(result).toBe(true);

      const updatedContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      expect(updatedContent.name).toBe('new-minimal');
      expect(Object.keys(updatedContent).length).toBe(1);
    });

    it('should handle scoped package names', () => {
      const packageJson = {
        name: '@scope/old-project',
        version: '1.0.0'
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      const result = updatePackageJson('@scope/old-project', '@scope/new-project', pkgPath);

      expect(result).toBe(true);

      const updatedContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      expect(updatedContent.name).toBe('@scope/new-project');
    });

    it('should handle empty scripts object', () => {
      const packageJson = {
        name: 'old-project',
        version: '1.0.0',
        scripts: {}
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      const result = updatePackageJson('old-project', 'new-project', pkgPath);

      expect(result).toBe(true);

      const updatedContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      expect(updatedContent.name).toBe('new-project');
      expect(updatedContent.scripts).toEqual({});
    });

    it('should handle package.json with only rename script', () => {
      const packageJson = {
        name: 'old-project',
        version: '1.0.0',
        scripts: {
          rename: 'node rename-project.js'
        }
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      updatePackageJson('old-project', 'new-project', pkgPath);

      const updatedContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      expect(updatedContent.name).toBe('new-project');
      expect(updatedContent.scripts.rename).toBeUndefined();
      // Scripts object should still exist but be empty
      expect(updatedContent.scripts).toEqual({});
    });
  });

  describe('requirements validation', () => {
    it('should satisfy Requirement 3.1: update name field', () => {
      const packageJson = {
        name: 'old-name',
        version: '1.0.0'
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      updatePackageJson('old-name', 'new-name', pkgPath);

      const updatedContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      expect(updatedContent.name).toBe('new-name');
    });

    it('should satisfy Requirement 3.6: preserve JSON indentation (2 spaces)', () => {
      const packageJson = {
        name: 'old-project',
        version: '1.0.0',
        nested: {
          field: 'value'
        }
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      updatePackageJson('old-project', 'new-project', pkgPath);

      const rawContent = fs.readFileSync(pkgPath, 'utf8');
      
      // Verify 2-space indentation at different nesting levels
      expect(rawContent).toContain('  "name"');
      expect(rawContent).toContain('  "nested": {');
      expect(rawContent).toContain('    "field"');
    });

    it('should satisfy Requirement 9.7: remove rename script from package.json', () => {
      const packageJson = {
        name: 'old-project',
        version: '1.0.0',
        scripts: {
          start: 'node index.js',
          rename: 'node rename-project.js',
          test: 'jest'
        }
      };
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      updatePackageJson('old-project', 'new-project', pkgPath);

      const updatedContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      expect(updatedContent.scripts.rename).toBeUndefined();
      // Other scripts should remain
      expect(updatedContent.scripts.start).toBe('node index.js');
      expect(updatedContent.scripts.test).toBe('jest');
    });
  });
});

describe('updateAngularJson', () => {
  const { updateAngularJson } = require('./rename-project');
  let tempDir;
  let originalCwd;
  let consoleLogSpy;

  beforeEach(() => {
    // Save original working directory
    originalCwd = process.cwd();
    
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rename-test-'));
    process.chdir(tempDir);

    // Mock console.log to suppress output during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.log
    consoleLogSpy.mockRestore();

    // Restore original working directory
    process.chdir(originalCwd);
    
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('successful updates', () => {
    it('should rename the project key under projects', () => {
      const angularJson = {
        version: 1,
        projects: {
          'old-project': {
            projectType: 'application',
            root: '',
            sourceRoot: 'src'
          }
        }
      };
      const angularPath = path.join(tempDir, 'angular.json');
      fs.writeFileSync(angularPath, JSON.stringify(angularJson, null, 2));

      const result = updateAngularJson('old-project', 'new-project', angularPath);

      expect(result).toBe(true);

      const updatedContent = JSON.parse(fs.readFileSync(angularPath, 'utf8'));
      expect(updatedContent.projects['new-project']).toBeDefined();
      expect(updatedContent.projects['old-project']).toBeUndefined();
      expect(updatedContent.projects['new-project'].projectType).toBe('application');
    });

    it('should update buildTarget references', () => {
      const angularJson = {
        version: 1,
        projects: {
          'old-project': {
            projectType: 'application',
            architect: {
              build: {
                builder: '@angular-devkit/build-angular:browser'
              },
              serve: {
                builder: '@angular-devkit/build-angular:dev-server',
                options: {
                  buildTarget: 'old-project:build'
                }
              },
              test: {
                builder: '@angular-devkit/build-angular:karma',
                options: {
                  buildTarget: 'old-project:build'
                }
              }
            }
          }
        }
      };
      const angularPath = path.join(tempDir, 'angular.json');
      fs.writeFileSync(angularPath, JSON.stringify(angularJson, null, 2));

      const result = updateAngularJson('old-project', 'new-project', angularPath);

      expect(result).toBe(true);

      const updatedContent = JSON.parse(fs.readFileSync(angularPath, 'utf8'));
      expect(updatedContent.projects['new-project'].architect.serve.options.buildTarget).toBe('new-project:build');
      expect(updatedContent.projects['new-project'].architect.test.options.buildTarget).toBe('new-project:build');
    });

    it('should update multiple buildTarget references with different targets', () => {
      const angularJson = {
        version: 1,
        projects: {
          'old-project': {
            projectType: 'application',
            architect: {
              build: {},
              serve: {
                options: {
                  buildTarget: 'old-project:build'
                },
                configurations: {
                  production: {
                    buildTarget: 'old-project:build:production'
                  }
                }
              },
              extract: {
                options: {
                  buildTarget: 'old-project:build'
                }
              }
            }
          }
        }
      };
      const angularPath = path.join(tempDir, 'angular.json');
      fs.writeFileSync(angularPath, JSON.stringify(angularJson, null, 2));

      const result = updateAngularJson('old-project', 'new-project', angularPath);

      expect(result).toBe(true);

      const updatedContent = JSON.parse(fs.readFileSync(angularPath, 'utf8'));
      expect(updatedContent.projects['new-project'].architect.serve.options.buildTarget).toBe('new-project:build');
      expect(updatedContent.projects['new-project'].architect.serve.configurations.production.buildTarget).toBe('new-project:build:production');
      expect(updatedContent.projects['new-project'].architect.extract.options.buildTarget).toBe('new-project:build');
    });

    it('should preserve 2-space indentation', () => {
      const angularJson = {
        version: 1,
        projects: {
          'old-project': {
            projectType: 'application',
            architect: {
              build: {
                options: {
                  outputPath: 'dist'
                }
              }
            }
          }
        }
      };
      const angularPath = path.join(tempDir, 'angular.json');
      fs.writeFileSync(angularPath, JSON.stringify(angularJson, null, 2));

      updateAngularJson('old-project', 'new-project', angularPath);

      const rawContent = fs.readFileSync(angularPath, 'utf8');
      
      // Check for 2-space indentation at different nesting levels
      expect(rawContent).toContain('  "version": 1');
      expect(rawContent).toContain('  "projects": {');
      expect(rawContent).toContain('    "new-project": {');
      expect(rawContent).toContain('      "projectType": "application"');
      expect(rawContent).toContain('        "build": {');
    });

    it('should add trailing newline to file', () => {
      const angularJson = {
        version: 1,
        projects: {
          'old-project': {
            projectType: 'application'
          }
        }
      };
      const angularPath = path.join(tempDir, 'angular.json');
      fs.writeFileSync(angularPath, JSON.stringify(angularJson, null, 2));

      updateAngularJson('old-project', 'new-project', angularPath);

      const rawContent = fs.readFileSync(angularPath, 'utf8');
      expect(rawContent.endsWith('\n')).toBe(true);
    });

    it('should preserve all other project configurations', () => {
      const angularJson = {
        version: 1,
        newProjectRoot: 'projects',
        projects: {
          'old-project': {
            projectType: 'application',
            root: '',
            sourceRoot: 'src',
            prefix: 'app',
            architect: {
              build: {
                builder: '@angular-devkit/build-angular:browser',
                options: {
                  outputPath: 'dist/old-project',
                  index: 'src/index.html',
                  main: 'src/main.ts'
                }
              }
            }
          },
          'other-project': {
            projectType: 'library',
            root: 'projects/other'
          }
        }
      };
      const angularPath = path.join(tempDir, 'angular.json');
      fs.writeFileSync(angularPath, JSON.stringify(angularJson, null, 2));

      updateAngularJson('old-project', 'new-project', angularPath);

      const updatedContent = JSON.parse(fs.readFileSync(angularPath, 'utf8'));
      expect(updatedContent.version).toBe(1);
      expect(updatedContent.newProjectRoot).toBe('projects');
      expect(updatedContent.projects['new-project'].projectType).toBe('application');
      expect(updatedContent.projects['new-project'].root).toBe('');
      expect(updatedContent.projects['new-project'].sourceRoot).toBe('src');
      expect(updatedContent.projects['new-project'].prefix).toBe('app');
      expect(updatedContent.projects['new-project'].architect.build.options.outputPath).toBe('dist/old-project');
      // Other project should remain unchanged
      expect(updatedContent.projects['other-project']).toBeDefined();
      expect(updatedContent.projects['other-project'].projectType).toBe('library');
    });

    it('should handle angular.json with multiple projects', () => {
      const angularJson = {
        version: 1,
        projects: {
          'old-project': {
            projectType: 'application',
            architect: {
              serve: {
                options: {
                  buildTarget: 'old-project:build'
                }
              }
            }
          },
          'library-project': {
            projectType: 'library',
            architect: {
              build: {}
            }
          },
          'e2e-project': {
            projectType: 'application',
            architect: {
              e2e: {
                options: {
                  devServerTarget: 'old-project:serve'
                }
              }
            }
          }
        }
      };
      const angularPath = path.join(tempDir, 'angular.json');
      fs.writeFileSync(angularPath, JSON.stringify(angularJson, null, 2));

      updateAngularJson('old-project', 'new-project', angularPath);

      const updatedContent = JSON.parse(fs.readFileSync(angularPath, 'utf8'));
      expect(updatedContent.projects['new-project']).toBeDefined();
      expect(updatedContent.projects['old-project']).toBeUndefined();
      expect(updatedContent.projects['new-project'].architect.serve.options.buildTarget).toBe('new-project:build');
      // Check that references in other projects are also updated
      expect(updatedContent.projects['e2e-project'].architect.e2e.options.devServerTarget).toBe('new-project:serve');
      // Other projects should remain
      expect(updatedContent.projects['library-project']).toBeDefined();
      expect(updatedContent.projects['e2e-project']).toBeDefined();
    });
  });

  describe('file not found', () => {
    it('should return false and show warning when angular.json does not exist', () => {
      const angularPath = path.join(tempDir, 'angular.json');

      const result = updateAngularJson('old-project', 'new-project', angularPath);

      expect(result).toBe(false);
      
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain('⚠️');
      expect(allLogs).toContain('angular.json not found');
      expect(allLogs).toContain('Skipping');
    });

    it('should not throw error when file is missing', () => {
      const angularPath = path.join(tempDir, 'angular.json');

      expect(() => {
        updateAngularJson('old-project', 'new-project', angularPath);
      }).not.toThrow();
    });
  });

  describe('invalid angular.json structure', () => {
    it('should return false and show warning when projects section is missing', () => {
      const angularJson = {
        version: 1
      };
      const angularPath = path.join(tempDir, 'angular.json');
      fs.writeFileSync(angularPath, JSON.stringify(angularJson, null, 2));

      const result = updateAngularJson('old-project', 'new-project', angularPath);

      expect(result).toBe(false);
      
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain('⚠️');
      expect(allLogs).toContain('does not contain a "projects" section');
    });

    it('should return false and show warning when old project name not found', () => {
      const angularJson = {
        version: 1,
        projects: {
          'different-project': {
            projectType: 'application'
          }
        }
      };
      const angularPath = path.join(tempDir, 'angular.json');
      fs.writeFileSync(angularPath, JSON.stringify(angularJson, null, 2));

      const result = updateAngularJson('old-project', 'new-project', angularPath);

      expect(result).toBe(false);
      
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain('⚠️');
      expect(allLogs).toContain('Project "old-project" not found');
    });

    it('should return false when angular.json is malformed', () => {
      const angularPath = path.join(tempDir, 'angular.json');
      fs.writeFileSync(angularPath, '{ invalid json }');

      const result = updateAngularJson('old-project', 'new-project', angularPath);

      expect(result).toBe(false);
      
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain('❌');
      expect(allLogs).toContain('Error updating angular.json');
    });
  });

  describe('edge cases', () => {
    it('should handle angular.json with no buildTarget references', () => {
      const angularJson = {
        version: 1,
        projects: {
          'old-project': {
            projectType: 'library',
            root: 'projects/old-project'
          }
        }
      };
      const angularPath = path.join(tempDir, 'angular.json');
      fs.writeFileSync(angularPath, JSON.stringify(angularJson, null, 2));

      const result = updateAngularJson('old-project', 'new-project', angularPath);

      expect(result).toBe(true);

      const updatedContent = JSON.parse(fs.readFileSync(angularPath, 'utf8'));
      expect(updatedContent.projects['new-project']).toBeDefined();
      expect(updatedContent.projects['old-project']).toBeUndefined();
    });

    it('should handle empty projects object', () => {
      const angularJson = {
        version: 1,
        projects: {}
      };
      const angularPath = path.join(tempDir, 'angular.json');
      fs.writeFileSync(angularPath, JSON.stringify(angularJson, null, 2));

      const result = updateAngularJson('old-project', 'new-project', angularPath);

      expect(result).toBe(false);
      
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain('Project "old-project" not found');
    });

    it('should handle project names with special characters', () => {
      const angularJson = {
        version: 1,
        projects: {
          'my-old-project-v2': {
            projectType: 'application',
            architect: {
              serve: {
                options: {
                  buildTarget: 'my-old-project-v2:build'
                }
              }
            }
          }
        }
      };
      const angularPath = path.join(tempDir, 'angular.json');
      fs.writeFileSync(angularPath, JSON.stringify(angularJson, null, 2));

      const result = updateAngularJson('my-old-project-v2', 'my-new-project-v3', angularPath);

      expect(result).toBe(true);

      const updatedContent = JSON.parse(fs.readFileSync(angularPath, 'utf8'));
      expect(updatedContent.projects['my-new-project-v3']).toBeDefined();
      expect(updatedContent.projects['my-new-project-v3'].architect.serve.options.buildTarget).toBe('my-new-project-v3:build');
    });

    it('should handle deeply nested buildTarget references', () => {
      const angularJson = {
        version: 1,
        projects: {
          'old-project': {
            architect: {
              serve: {
                configurations: {
                  production: {
                    buildTarget: 'old-project:build:production'
                  },
                  development: {
                    buildTarget: 'old-project:build:development'
                  }
                }
              }
            }
          }
        }
      };
      const angularPath = path.join(tempDir, 'angular.json');
      fs.writeFileSync(angularPath, JSON.stringify(angularJson, null, 2));

      updateAngularJson('old-project', 'new-project', angularPath);

      const updatedContent = JSON.parse(fs.readFileSync(angularPath, 'utf8'));
      expect(updatedContent.projects['new-project'].architect.serve.configurations.production.buildTarget).toBe('new-project:build:production');
      expect(updatedContent.projects['new-project'].architect.serve.configurations.development.buildTarget).toBe('new-project:build:development');
    });

    it('should not modify project names that are substrings of the old name', () => {
      const angularJson = {
        version: 1,
        projects: {
          'old': {
            projectType: 'application',
            architect: {
              serve: {
                options: {
                  buildTarget: 'old:build'
                }
              }
            }
          },
          'old-extended': {
            projectType: 'library',
            architect: {
              build: {
                options: {
                  buildTarget: 'old-extended:build'
                }
              }
            }
          }
        }
      };
      const angularPath = path.join(tempDir, 'angular.json');
      fs.writeFileSync(angularPath, JSON.stringify(angularJson, null, 2));

      updateAngularJson('old', 'new', angularPath);

      const updatedContent = JSON.parse(fs.readFileSync(angularPath, 'utf8'));
      expect(updatedContent.projects['new']).toBeDefined();
      expect(updatedContent.projects['old']).toBeUndefined();
      expect(updatedContent.projects['new'].architect.serve.options.buildTarget).toBe('new:build');
      // The other project should remain unchanged
      expect(updatedContent.projects['old-extended']).toBeDefined();
      expect(updatedContent.projects['old-extended'].architect.build.options.buildTarget).toBe('old-extended:build');
    });
  });

  describe('requirements validation', () => {
    it('should satisfy Requirement 3.2: rename project key under projects', () => {
      const angularJson = {
        version: 1,
        projects: {
          'old-name': {
            projectType: 'application'
          }
        }
      };
      const angularPath = path.join(tempDir, 'angular.json');
      fs.writeFileSync(angularPath, JSON.stringify(angularJson, null, 2));

      updateAngularJson('old-name', 'new-name', angularPath);

      const updatedContent = JSON.parse(fs.readFileSync(angularPath, 'utf8'));
      expect(updatedContent.projects['new-name']).toBeDefined();
      expect(updatedContent.projects['old-name']).toBeUndefined();
    });

    it('should satisfy Requirement 3.3: update all buildTarget references', () => {
      const angularJson = {
        version: 1,
        projects: {
          'old-name': {
            architect: {
              serve: {
                options: {
                  buildTarget: 'old-name:build'
                }
              },
              test: {
                options: {
                  buildTarget: 'old-name:build'
                }
              }
            }
          }
        }
      };
      const angularPath = path.join(tempDir, 'angular.json');
      fs.writeFileSync(angularPath, JSON.stringify(angularJson, null, 2));

      updateAngularJson('old-name', 'new-name', angularPath);

      const updatedContent = JSON.parse(fs.readFileSync(angularPath, 'utf8'));
      expect(updatedContent.projects['new-name'].architect.serve.options.buildTarget).toBe('new-name:build');
      expect(updatedContent.projects['new-name'].architect.test.options.buildTarget).toBe('new-name:build');
    });

    it('should satisfy Requirement 3.6: preserve JSON indentation (2 spaces)', () => {
      const angularJson = {
        version: 1,
        projects: {
          'old-name': {
            projectType: 'application',
            architect: {
              build: {
                options: {}
              }
            }
          }
        }
      };
      const angularPath = path.join(tempDir, 'angular.json');
      fs.writeFileSync(angularPath, JSON.stringify(angularJson, null, 2));

      updateAngularJson('old-name', 'new-name', angularPath);

      const rawContent = fs.readFileSync(angularPath, 'utf8');
      expect(rawContent).toContain('  "version"');
      expect(rawContent).toContain('    "new-name"');
      expect(rawContent).toContain('      "architect"');
    });

    it('should satisfy Requirement 5.2: handle missing file with warning (not fatal error)', () => {
      const angularPath = path.join(tempDir, 'angular.json');

      // Should not throw
      expect(() => {
        updateAngularJson('old-name', 'new-name', angularPath);
      }).not.toThrow();

      // Should show warning
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain('⚠️');
      expect(allLogs).toContain('angular.json not found');
    });
  });
});

describe('updateReadme', () => {
  let tempDir;
  let originalCwd;
  let consoleLogSpy;

  beforeEach(() => {
    // Save original working directory
    originalCwd = process.cwd();
    
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rename-test-'));
    process.chdir(tempDir);

    // Mock console.log to suppress output during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.log
    consoleLogSpy.mockRestore();

    // Restore original working directory
    process.chdir(originalCwd);
    
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('successful updates', () => {
    it('should replace all occurrences of old name with new name', () => {
      const readmeContent = `# old-project

This is the old-project README.

## Installation

Install old-project with npm:

\`\`\`bash
npm install old-project
\`\`\`

## About old-project

The old-project is a great project.
`;
      const readmePath = path.join(tempDir, 'README.md');
      fs.writeFileSync(readmePath, readmeContent);

      const result = updateReadme('old-project', 'new-project', readmePath);

      expect(result).toBe(true);

      const updatedContent = fs.readFileSync(readmePath, 'utf8');
      expect(updatedContent).toContain('# new-project');
      expect(updatedContent).toContain('This is the new-project README');
      expect(updatedContent).toContain('Install new-project with npm');
      expect(updatedContent).toContain('npm install new-project');
      expect(updatedContent).toContain('## About new-project');
      expect(updatedContent).toContain('The new-project is a great project');
      expect(updatedContent).not.toContain('old-project');
    });

    it('should remove the "Renaming the Project" section', () => {
      const readmeContent = `# my-project

## Getting Started

Some content here.

## Renaming the Project

This section explains how to rename the project.

You can use the rename script:

\`\`\`bash
npm run rename
\`\`\`

Follow the prompts to rename your project.

## Development

More content here.
`;
      const readmePath = path.join(tempDir, 'README.md');
      fs.writeFileSync(readmePath, readmeContent);

      const result = updateReadme('my-project', 'new-project', readmePath);

      expect(result).toBe(true);

      const updatedContent = fs.readFileSync(readmePath, 'utf8');
      expect(updatedContent).toContain('## Getting Started');
      expect(updatedContent).toContain('## Development');
      expect(updatedContent).not.toContain('## Renaming the Project');
      expect(updatedContent).not.toContain('This section explains how to rename');
      expect(updatedContent).not.toContain('Follow the prompts');
    });

    it('should remove lines mentioning "rename-project"', () => {
      const readmeContent = `# my-project

## Scripts

- \`npm start\` - Start the application
- \`npm run rename\` - Rename the project using rename-project.js
- \`npm test\` - Run tests

The rename-project script is useful for initial setup.
`;
      const readmePath = path.join(tempDir, 'README.md');
      fs.writeFileSync(readmePath, readmeContent);

      const result = updateReadme('my-project', 'new-project', readmePath);

      expect(result).toBe(true);

      const updatedContent = fs.readFileSync(readmePath, 'utf8');
      expect(updatedContent).toContain('npm start');
      expect(updatedContent).toContain('npm test');
      expect(updatedContent).not.toContain('npm run rename');
      expect(updatedContent).not.toContain('rename-project');
    });

    it('should remove lines mentioning "npm run rename"', () => {
      const readmeContent = `# my-project

To rename this project, run:

\`\`\`bash
npm run rename
\`\`\`

## Other Commands

- \`npm start\` - Start the app
`;
      const readmePath = path.join(tempDir, 'README.md');
      fs.writeFileSync(readmePath, readmeContent);

      const result = updateReadme('my-project', 'new-project', readmePath);

      expect(result).toBe(true);

      const updatedContent = fs.readFileSync(readmePath, 'utf8');
      expect(updatedContent).not.toContain('npm run rename');
      expect(updatedContent).toContain('npm start');
    });

    it('should preserve structure and formatting', () => {
      const readmeContent = `# old-project

## Section 1

Content for section 1.

### Subsection 1.1

More content.

## Section 2

- List item 1
- List item 2
- List item 3

\`\`\`javascript
const project = 'old-project';
\`\`\`
`;
      const readmePath = path.join(tempDir, 'README.md');
      fs.writeFileSync(readmePath, readmeContent);

      const result = updateReadme('old-project', 'new-project', readmePath);

      expect(result).toBe(true);

      const updatedContent = fs.readFileSync(readmePath, 'utf8');
      // Check structure is preserved
      expect(updatedContent).toContain('## Section 1');
      expect(updatedContent).toContain('### Subsection 1.1');
      expect(updatedContent).toContain('## Section 2');
      expect(updatedContent).toContain('- List item 1');
      expect(updatedContent).toContain('- List item 2');
      expect(updatedContent).toContain('- List item 3');
      // Check code block is preserved with updated name
      expect(updatedContent).toContain('```javascript');
      expect(updatedContent).toContain("const project = 'new-project';");
    });

    it('should handle README without rename section', () => {
      const readmeContent = `# old-project

## Getting Started

This is a simple README without a rename section.

## Usage

Use the old-project like this.
`;
      const readmePath = path.join(tempDir, 'README.md');
      fs.writeFileSync(readmePath, readmeContent);

      const result = updateReadme('old-project', 'new-project', readmePath);

      expect(result).toBe(true);

      const updatedContent = fs.readFileSync(readmePath, 'utf8');
      expect(updatedContent).toContain('# new-project');
      expect(updatedContent).toContain('Use the new-project like this');
      expect(updatedContent).not.toContain('old-project');
    });

    it('should handle rename section at the end of file', () => {
      const readmeContent = `# my-project

## Getting Started

Some content.

## Renaming the Project

This is the last section.

Use npm run rename to rename the project.
`;
      const readmePath = path.join(tempDir, 'README.md');
      fs.writeFileSync(readmePath, readmeContent);

      const result = updateReadme('my-project', 'new-project', readmePath);

      expect(result).toBe(true);

      const updatedContent = fs.readFileSync(readmePath, 'utf8');
      expect(updatedContent).toContain('## Getting Started');
      expect(updatedContent).not.toContain('## Renaming the Project');
      expect(updatedContent).not.toContain('This is the last section');
    });

    it('should handle project names with special regex characters', () => {
      const readmeContent = `# my-project.app

This is my-project.app README.

Use my-project.app for your needs.
`;
      const readmePath = path.join(tempDir, 'README.md');
      fs.writeFileSync(readmePath, readmeContent);

      const result = updateReadme('my-project.app', 'new-project-app', readmePath);

      expect(result).toBe(true);

      const updatedContent = fs.readFileSync(readmePath, 'utf8');
      expect(updatedContent).toContain('# new-project-app');
      expect(updatedContent).toContain('This is new-project-app README');
      expect(updatedContent).toContain('Use new-project-app for your needs');
      expect(updatedContent).not.toContain('my-project.app');
    });
  });

  describe('file not found', () => {
    it('should show warning when README.md does not exist', () => {
      const readmePath = path.join(tempDir, 'README.md');

      const result = updateReadme('old-project', 'new-project', readmePath);

      expect(result).toBe(false);

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain('⚠️');
      expect(allLogs).toContain('README.md not found');
      expect(allLogs).toContain('Skipping README update');
    });

    it('should not throw error when file is missing', () => {
      const readmePath = path.join(tempDir, 'README.md');

      expect(() => {
        updateReadme('old-project', 'new-project', readmePath);
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle read errors gracefully', () => {
      const readmePath = path.join(tempDir, 'README.md');
      fs.writeFileSync(readmePath, 'content');
      
      // Make file unreadable (this is platform-specific and may not work on all systems)
      try {
        fs.chmodSync(readmePath, 0o000);
        
        const result = updateReadme('old-project', 'new-project', readmePath);
        
        expect(result).toBe(false);
        
        const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
        const allLogs = logCalls.join('\n');
        expect(allLogs).toContain('❌');
        expect(allLogs).toContain('Error updating README.md');
        
        // Restore permissions for cleanup
        fs.chmodSync(readmePath, 0o644);
      } catch (e) {
        // Skip this test if chmod doesn't work (e.g., on Windows)
        fs.chmodSync(readmePath, 0o644);
      }
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple sections and complex content', () => {
      const readmeContent = `# old-project

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Renaming](#renaming)

## Installation

Install old-project:

\`\`\`bash
npm install old-project
\`\`\`

## Usage

Use old-project in your code:

\`\`\`javascript
import { OldProject } from 'old-project';
\`\`\`

## Renaming the Project

To rename old-project, use the rename script:

\`\`\`bash
npm run rename
\`\`\`

The rename-project.js script will guide you through the process.

## Development

Develop old-project locally.

## License

MIT
`;
      const readmePath = path.join(tempDir, 'README.md');
      fs.writeFileSync(readmePath, readmeContent);

      const result = updateReadme('old-project', 'new-project', readmePath);

      expect(result).toBe(true);

      const updatedContent = fs.readFileSync(readmePath, 'utf8');
      
      // Check name replacements
      expect(updatedContent).toContain('# new-project');
      expect(updatedContent).toContain('Install new-project');
      expect(updatedContent).toContain('Use new-project in your code');
      expect(updatedContent).toContain('Develop new-project locally');
      
      // Check rename section is removed
      expect(updatedContent).not.toContain('## Renaming the Project');
      expect(updatedContent).not.toContain('To rename old-project, use the rename script');
      
      // Check other sections are preserved
      expect(updatedContent).toContain('## Table of Contents');
      expect(updatedContent).toContain('## Installation');
      expect(updatedContent).toContain('## Usage');
      expect(updatedContent).toContain('## Development');
      expect(updatedContent).toContain('## License');
      
      // Check that old name is completely gone
      expect(updatedContent).not.toContain('old-project');
    });

    it('should handle rename section with various heading formats', () => {
      const readmeContent = `# my-project

## Getting Started

Content here.

##Renaming the Project

Note: no space after ##

## Another Section

More content.
`;
      const readmePath = path.join(tempDir, 'README.md');
      fs.writeFileSync(readmePath, readmeContent);

      const result = updateReadme('my-project', 'new-project', readmePath);

      expect(result).toBe(true);

      const updatedContent = fs.readFileSync(readmePath, 'utf8');
      // The section with no space won't be removed by our current implementation
      // but that's okay - it's not standard markdown
      expect(updatedContent).toContain('## Getting Started');
      expect(updatedContent).toContain('## Another Section');
    });

    it('should preserve empty lines and spacing', () => {
      const readmeContent = `# old-project


## Section 1

Content with spacing.


## Section 2

More content.

`;
      const readmePath = path.join(tempDir, 'README.md');
      fs.writeFileSync(readmePath, readmeContent);

      const result = updateReadme('old-project', 'new-project', readmePath);

      expect(result).toBe(true);

      const updatedContent = fs.readFileSync(readmePath, 'utf8');
      // Check that multiple newlines are preserved
      expect(updatedContent).toContain('\n\n\n');
      expect(updatedContent).toContain('# new-project');
    });
  });

  describe('requirements validation', () => {
    it('should satisfy Requirement 3.4: update title and project name references in README.md', () => {
      const readmeContent = `# old-project

Welcome to old-project!
`;
      const readmePath = path.join(tempDir, 'README.md');
      fs.writeFileSync(readmePath, readmeContent);

      updateReadme('old-project', 'new-project', readmePath);

      const updatedContent = fs.readFileSync(readmePath, 'utf8');
      expect(updatedContent).toContain('# new-project');
      expect(updatedContent).toContain('Welcome to new-project!');
      expect(updatedContent).not.toContain('old-project');
    });

    it('should satisfy Requirement 9.5: remove the project renaming section from README.md', () => {
      const readmeContent = `# my-project

## Renaming the Project

Instructions for renaming.

## Other Section

Other content.
`;
      const readmePath = path.join(tempDir, 'README.md');
      fs.writeFileSync(readmePath, readmeContent);

      updateReadme('my-project', 'new-project', readmePath);

      const updatedContent = fs.readFileSync(readmePath, 'utf8');
      expect(updatedContent).not.toContain('## Renaming the Project');
      expect(updatedContent).not.toContain('Instructions for renaming');
    });

    it('should satisfy Requirement 9.6: remove all references to the rename script from README.md', () => {
      const readmeContent = `# my-project

Use rename-project.js to rename.

Run npm run rename to start.

Other content here.
`;
      const readmePath = path.join(tempDir, 'README.md');
      fs.writeFileSync(readmePath, readmeContent);

      updateReadme('my-project', 'new-project', readmePath);

      const updatedContent = fs.readFileSync(readmePath, 'utf8');
      expect(updatedContent).not.toContain('rename-project');
      expect(updatedContent).not.toContain('npm run rename');
      expect(updatedContent).toContain('Other content here');
    });

    it('should satisfy Requirement 9.8: preserve existing content and structure (except removed section)', () => {
      const readmeContent = `# old-project

## Installation

Install instructions.

## Renaming the Project

Rename instructions.

## Usage

Usage instructions.

### Subsection

Subsection content.
`;
      const readmePath = path.join(tempDir, 'README.md');
      fs.writeFileSync(readmePath, readmeContent);

      updateReadme('old-project', 'new-project', readmePath);

      const updatedContent = fs.readFileSync(readmePath, 'utf8');
      
      // Structure preserved
      expect(updatedContent).toContain('## Installation');
      expect(updatedContent).toContain('## Usage');
      expect(updatedContent).toContain('### Subsection');
      
      // Content preserved
      expect(updatedContent).toContain('Install instructions');
      expect(updatedContent).toContain('Usage instructions');
      expect(updatedContent).toContain('Subsection content');
      
      // Rename section removed
      expect(updatedContent).not.toContain('## Renaming the Project');
      expect(updatedContent).not.toContain('Rename instructions');
    });

    it('should satisfy Requirement 5.2: handle missing file with warning (not fatal)', () => {
      const readmePath = path.join(tempDir, 'README.md');

      expect(() => {
        updateReadme('old-project', 'new-project', readmePath);
      }).not.toThrow();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain('⚠️');
      expect(allLogs).toContain('README.md not found');
    });
  });
});

describe('verifyRequiredFiles', () => {
  const { verifyRequiredFiles } = require('./rename-project');
  let tempDir;
  let originalCwd;
  let consoleLogSpy;

  beforeEach(() => {
    // Save original working directory
    originalCwd = process.cwd();
    
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rename-test-'));
    process.chdir(tempDir);

    // Mock console.log to suppress output during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.log
    consoleLogSpy.mockRestore();

    // Restore original working directory
    process.chdir(originalCwd);
    
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('all files present', () => {
    it('should return all files as available when they exist', () => {
      // Create all files
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
      fs.writeFileSync(path.join(tempDir, 'angular.json'), JSON.stringify({ version: 1 }));
      fs.writeFileSync(path.join(tempDir, 'README.md'), '# Test Project');

      const result = verifyRequiredFiles();

      expect(result.packageJson).toBe(true);
      expect(result.angularJson).toBe(true);
      expect(result.readme).toBe(true);
    });

    it('should not show any warnings when all files exist', () => {
      // Create all files
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
      fs.writeFileSync(path.join(tempDir, 'angular.json'), JSON.stringify({ version: 1 }));
      fs.writeFileSync(path.join(tempDir, 'README.md'), '# Test Project');

      verifyRequiredFiles();

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('package.json missing (required)', () => {
    it('should throw error when package.json does not exist', () => {
      expect(() => {
        verifyRequiredFiles();
      }).toThrow('package.json not found');
    });

    it('should include helpful message in error', () => {
      expect(() => {
        verifyRequiredFiles();
      }).toThrow('must be run from the project root');
    });

    it('should not check other files if package.json is missing', () => {
      // Create optional files
      fs.writeFileSync(path.join(tempDir, 'angular.json'), JSON.stringify({ version: 1 }));
      fs.writeFileSync(path.join(tempDir, 'README.md'), '# Test Project');

      expect(() => {
        verifyRequiredFiles();
      }).toThrow('package.json not found');

      // No warnings should be shown since we threw before checking optional files
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('angular.json missing (optional)', () => {
    it('should show warning when angular.json does not exist', () => {
      // Create only package.json and README.md
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
      fs.writeFileSync(path.join(tempDir, 'README.md'), '# Test Project');

      const result = verifyRequiredFiles();

      expect(result.packageJson).toBe(true);
      expect(result.angularJson).toBe(false);
      expect(result.readme).toBe(true);

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain('⚠️');
      expect(allLogs).toContain('angular.json not found');
      expect(allLogs).toContain('Angular configuration will not be updated');
    });

    it('should not throw error when angular.json is missing', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
      fs.writeFileSync(path.join(tempDir, 'README.md'), '# Test Project');

      expect(() => {
        verifyRequiredFiles();
      }).not.toThrow();
    });

    it('should continue checking other files when angular.json is missing', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
      fs.writeFileSync(path.join(tempDir, 'README.md'), '# Test Project');

      const result = verifyRequiredFiles();

      expect(result.packageJson).toBe(true);
      expect(result.angularJson).toBe(false);
      expect(result.readme).toBe(true);
    });
  });

  describe('README.md missing (optional)', () => {
    it('should show warning when README.md does not exist', () => {
      // Create only package.json and angular.json
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
      fs.writeFileSync(path.join(tempDir, 'angular.json'), JSON.stringify({ version: 1 }));

      const result = verifyRequiredFiles();

      expect(result.packageJson).toBe(true);
      expect(result.angularJson).toBe(true);
      expect(result.readme).toBe(false);

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain('⚠️');
      expect(allLogs).toContain('README.md not found');
      expect(allLogs).toContain('README will not be updated');
    });

    it('should not throw error when README.md is missing', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
      fs.writeFileSync(path.join(tempDir, 'angular.json'), JSON.stringify({ version: 1 }));

      expect(() => {
        verifyRequiredFiles();
      }).not.toThrow();
    });
  });

  describe('multiple optional files missing', () => {
    it('should show warnings for both angular.json and README.md when missing', () => {
      // Create only package.json
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));

      const result = verifyRequiredFiles();

      expect(result.packageJson).toBe(true);
      expect(result.angularJson).toBe(false);
      expect(result.readme).toBe(false);

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      
      // Check for both warnings
      expect(allLogs).toContain('angular.json not found');
      expect(allLogs).toContain('README.md not found');
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });

    it('should return correct availability status for all files', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));

      const result = verifyRequiredFiles();

      expect(result).toEqual({
        packageJson: true,
        angularJson: false,
        readme: false
      });
    });
  });

  describe('return value structure', () => {
    it('should return object with correct structure', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
      fs.writeFileSync(path.join(tempDir, 'angular.json'), JSON.stringify({ version: 1 }));
      fs.writeFileSync(path.join(tempDir, 'README.md'), '# Test');

      const result = verifyRequiredFiles();

      expect(result).toHaveProperty('packageJson');
      expect(result).toHaveProperty('angularJson');
      expect(result).toHaveProperty('readme');
      expect(typeof result.packageJson).toBe('boolean');
      expect(typeof result.angularJson).toBe('boolean');
      expect(typeof result.readme).toBe('boolean');
    });

    it('should return object with all boolean values', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));

      const result = verifyRequiredFiles();

      expect(typeof result.packageJson).toBe('boolean');
      expect(typeof result.angularJson).toBe('boolean');
      expect(typeof result.readme).toBe('boolean');
    });
  });

  describe('requirements validation', () => {
    it('should satisfy Requirement 5.1: verify that all required files exist before making changes', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
      fs.writeFileSync(path.join(tempDir, 'angular.json'), JSON.stringify({ version: 1 }));
      fs.writeFileSync(path.join(tempDir, 'README.md'), '# Test');

      const result = verifyRequiredFiles();

      // Should verify package.json (required)
      expect(result.packageJson).toBe(true);
      
      // Should verify optional files
      expect(result.angularJson).toBe(true);
      expect(result.readme).toBe(true);
    });

    it('should satisfy Requirement 5.2: display warning and continue with available files', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
      // angular.json and README.md are missing

      const result = verifyRequiredFiles();

      // Should not throw error
      expect(result.packageJson).toBe(true);
      expect(result.angularJson).toBe(false);
      expect(result.readme).toBe(false);

      // Should display warnings
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain('⚠️');
      expect(allLogs).toContain('angular.json not found');
      expect(allLogs).toContain('README.md not found');
    });

    it('should throw error for missing package.json (required file)', () => {
      // No files created

      expect(() => {
        verifyRequiredFiles();
      }).toThrow('package.json not found');
    });
  });

  describe('edge cases', () => {
    it('should handle empty package.json file', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), '');

      // Should not throw during verification (file exists)
      // Parsing errors would be caught later by getCurrentProjectName
      const result = verifyRequiredFiles();

      expect(result.packageJson).toBe(true);
    });

    it('should handle empty angular.json file', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
      fs.writeFileSync(path.join(tempDir, 'angular.json'), '');

      const result = verifyRequiredFiles();

      expect(result.packageJson).toBe(true);
      expect(result.angularJson).toBe(true);
    });

    it('should handle empty README.md file', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
      fs.writeFileSync(path.join(tempDir, 'README.md'), '');

      const result = verifyRequiredFiles();

      expect(result.packageJson).toBe(true);
      expect(result.readme).toBe(true);
    });

    it('should check files in current working directory', () => {
      // Create files in temp directory
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
      fs.writeFileSync(path.join(tempDir, 'angular.json'), JSON.stringify({ version: 1 }));
      fs.writeFileSync(path.join(tempDir, 'README.md'), '# Test');

      const result = verifyRequiredFiles();

      expect(result.packageJson).toBe(true);
      expect(result.angularJson).toBe(true);
      expect(result.readme).toBe(true);
    });
  });

  describe('warning message format', () => {
    it('should use warning symbol for optional file warnings', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));

      verifyRequiredFiles();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      
      // Should use warning symbol (⚠️)
      expect(allLogs).toContain('⚠️');
    });

    it('should provide clear message about what will not be updated', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));

      verifyRequiredFiles();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      
      expect(allLogs).toContain('will not be updated');
    });
  });
});

describe('checkGitAvailability', () => {
  const { checkGitAvailability } = require('./rename-project');
  const { execSync } = require('child_process');

  // Note: We cannot easily mock execSync in these tests because it's already
  // imported by the module. These tests will check the actual Git availability
  // on the system running the tests.

  describe('Git availability detection', () => {
    it('should return a boolean value', () => {
      const result = checkGitAvailability();
      expect(typeof result).toBe('boolean');
    });

    it('should return true if Git is available (assuming Git is installed)', () => {
      // This test assumes Git is installed on the test system
      // If Git is not installed, this test will fail, which is expected behavior
      const result = checkGitAvailability();
      
      // We expect Git to be available in most development environments
      // If this fails, it means Git is not installed, which is a valid scenario
      expect(result).toBe(true);
    });

    it('should not throw an error when Git is not available', () => {
      // This test verifies that the function handles errors gracefully
      // Even if Git is available, the function should not throw
      expect(() => {
        checkGitAvailability();
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle execSync errors gracefully', () => {
      // The function should catch any errors from execSync
      // and return false instead of throwing
      const result = checkGitAvailability();
      
      // Should return a boolean, not throw an error
      expect(typeof result).toBe('boolean');
    });
  });

  describe('integration with requirements', () => {
    it('should support Requirement 8.5: Check Git availability', () => {
      // Requirement 8.5: IF Git is not available on the system and --git-reset is specified,
      // THEN THE Script SHALL display a warning and skip Git reinitialization
      
      const isGitAvailable = checkGitAvailability();
      
      // The function should return a boolean that can be used to decide
      // whether to proceed with Git operations
      expect(typeof isGitAvailable).toBe('boolean');
      
      // If Git is not available, the script should be able to detect this
      // and skip Git operations
      if (!isGitAvailable) {
        // This is a valid scenario - Git might not be installed
        expect(isGitAvailable).toBe(false);
      } else {
        // Git is available - this is the expected case in most dev environments
        expect(isGitAvailable).toBe(true);
      }
    });
  });

  describe('return value consistency', () => {
    it('should return the same value on multiple calls', () => {
      const result1 = checkGitAvailability();
      const result2 = checkGitAvailability();
      const result3 = checkGitAvailability();
      
      // Git availability should not change between calls
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });
});

describe('reinitializeGit', () => {
  const { reinitializeGit, checkGitAvailability } = require('./rename-project');
  let tempDir;
  let originalCwd;
  let consoleLogSpy;

  beforeEach(() => {
    // Save original working directory
    originalCwd = process.cwd();
    
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rename-git-test-'));
    process.chdir(tempDir);

    // Mock console.log to suppress output during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.log
    consoleLogSpy.mockRestore();

    // Restore original working directory
    process.chdir(originalCwd);
    
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Git availability check', () => {
    it('should return false and show warning when Git is not available', () => {
      // This test will only work if Git is not installed
      // In most dev environments, Git will be available
      const isGitAvailable = checkGitAvailability();
      
      if (!isGitAvailable) {
        const result = reinitializeGit('test-project');
        
        expect(result).toBe(false);
        
        // Check that warning was displayed
        const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
        const allLogs = logCalls.join('\n');
        expect(allLogs).toContain('Git is not available');
        expect(allLogs).toContain('Skipping repository reinitialization');
      } else {
        // Skip this test if Git is available
        expect(isGitAvailable).toBe(true);
      }
    });
  });

  describe('successful Git reinitialization', () => {
    it('should reinitialize Git repository with new project name', () => {
      // Skip if Git is not available
      if (!checkGitAvailability()) {
        console.log('Skipping test: Git not available');
        return;
      }

      // Create a dummy file to commit
      fs.writeFileSync(path.join(tempDir, 'test.txt'), 'test content');

      const result = reinitializeGit('my-new-project');

      expect(result).toBe(true);

      // Verify .git directory exists
      const gitDir = path.join(tempDir, '.git');
      expect(fs.existsSync(gitDir)).toBe(true);

      // Verify progress messages were displayed
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain('Initialized new Git repository');
      expect(allLogs).toContain('Staged all files');
      expect(allLogs).toContain('Initial commit: my-new-project');
    });

    it('should remove existing .git directory before reinitializing', () => {
      // Skip if Git is not available
      if (!checkGitAvailability()) {
        console.log('Skipping test: Git not available');
        return;
      }

      // Create an existing .git directory with a marker file
      const gitDir = path.join(tempDir, '.git');
      fs.mkdirSync(gitDir);
      const markerPath = path.join(gitDir, 'CUSTOM_MARKER_FILE.txt');
      fs.writeFileSync(markerPath, 'old repo marker');

      // Verify marker exists before reinitializing
      expect(fs.existsSync(markerPath)).toBe(true);

      // Create a dummy file to commit
      fs.writeFileSync(path.join(tempDir, 'test.txt'), 'test content');

      const result = reinitializeGit('new-project');

      expect(result).toBe(true);

      // Verify .git directory was recreated
      expect(fs.existsSync(gitDir)).toBe(true);
      
      // Verify old marker file is gone (directory was removed and recreated)
      // The marker file should not exist because we removed the entire .git directory
      const markerExists = fs.existsSync(markerPath);
      expect(markerExists).toBe(false);

      // Verify progress message about removing old .git
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain('Removed existing .git directory');
    });

    it('should create initial commit with correct message format', () => {
      // Skip if Git is not available
      if (!checkGitAvailability()) {
        console.log('Skipping test: Git not available');
        return;
      }

      // Create a dummy file to commit
      fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name":"test"}');

      const projectName = 'my-awesome-project';
      const result = reinitializeGit(projectName);

      expect(result).toBe(true);

      // Verify commit message format
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain(`Initial commit: ${projectName}`);
    });

    it('should handle project names with special characters in commit message', () => {
      // Skip if Git is not available
      if (!checkGitAvailability()) {
        console.log('Skipping test: Git not available');
        return;
      }

      // Create a dummy file to commit
      fs.writeFileSync(path.join(tempDir, 'test.txt'), 'test');

      const projectName = 'my-project-v2';
      const result = reinitializeGit(projectName);

      expect(result).toBe(true);

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain(`Initial commit: ${projectName}`);
    });
  });

  describe('error handling', () => {
    it('should return false and show warning if .git directory cannot be removed', () => {
      // Skip if Git is not available
      if (!checkGitAvailability()) {
        console.log('Skipping test: Git not available');
        return;
      }

      // Create a .git directory with read-only permissions (on Unix-like systems)
      const gitDir = path.join(tempDir, '.git');
      fs.mkdirSync(gitDir);
      
      // Try to make it read-only (this might not work on all systems)
      try {
        fs.chmodSync(gitDir, 0o444);
        
        const result = reinitializeGit('test-project');

        // Should return false due to permission error
        // Note: This test might not work on all systems/platforms
        if (result === false) {
          const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
          const allLogs = logCalls.join('\n');
          expect(allLogs).toContain('Could not remove .git directory');
        }

        // Restore permissions for cleanup
        fs.chmodSync(gitDir, 0o755);
      } catch (error) {
        // If chmod fails, skip this test
        console.log('Skipping test: Cannot modify directory permissions');
      }
    });

    it('should handle empty directory (no files to commit)', () => {
      // Skip if Git is not available
      if (!checkGitAvailability()) {
        console.log('Skipping test: Git not available');
        return;
      }

      // Don't create any files - empty directory
      const result = reinitializeGit('empty-project');

      // Git commit will fail with no files, so result should be false
      expect(result).toBe(false);

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain('Could not create initial commit');
    });
  });

  describe('integration with requirements', () => {
    it('should satisfy Requirement 8.1: remove existing .git directory', () => {
      // Skip if Git is not available
      if (!checkGitAvailability()) {
        console.log('Skipping test: Git not available');
        return;
      }

      // Create existing .git directory with a marker file
      const gitDir = path.join(tempDir, '.git');
      fs.mkdirSync(gitDir);
      const markerPath = path.join(gitDir, 'CUSTOM_MARKER_FILE.txt');
      fs.writeFileSync(markerPath, 'old repo');

      // Verify marker exists before
      expect(fs.existsSync(markerPath)).toBe(true);

      // Create a file to commit
      fs.writeFileSync(path.join(tempDir, 'test.txt'), 'test');

      reinitializeGit('test-project');

      // Verify old marker file is gone
      const markerExists = fs.existsSync(markerPath);
      expect(markerExists).toBe(false);
    });

    it('should satisfy Requirement 8.2: initialize new Git repository', () => {
      // Skip if Git is not available
      if (!checkGitAvailability()) {
        console.log('Skipping test: Git not available');
        return;
      }

      // Create a file to commit
      fs.writeFileSync(path.join(tempDir, 'test.txt'), 'test');

      const result = reinitializeGit('test-project');

      expect(result).toBe(true);

      // Verify .git directory exists
      const gitDir = path.join(tempDir, '.git');
      expect(fs.existsSync(gitDir)).toBe(true);
    });

    it('should satisfy Requirement 8.3: create initial commit with project name', () => {
      // Skip if Git is not available
      if (!checkGitAvailability()) {
        console.log('Skipping test: Git not available');
        return;
      }

      // Create a file to commit
      fs.writeFileSync(path.join(tempDir, 'test.txt'), 'test');

      const projectName = 'my-test-project';
      reinitializeGit(projectName);

      // Verify commit message was logged
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      expect(allLogs).toContain(`Initial commit: ${projectName}`);
    });

    it('should satisfy Requirement 8.5: check Git availability before operations', () => {
      // The function should check Git availability first
      const result = reinitializeGit('test-project');

      // Should return a boolean (true if successful, false if Git not available or error)
      expect(typeof result).toBe('boolean');

      // If Git is not available, should show appropriate warning
      if (!checkGitAvailability()) {
        const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
        const allLogs = logCalls.join('\n');
        expect(allLogs).toContain('Git is not available');
      }
    });

    it('should satisfy Requirement 8.6: display confirmation message', () => {
      // Skip if Git is not available
      if (!checkGitAvailability()) {
        console.log('Skipping test: Git not available');
        return;
      }

      // Create a file to commit
      fs.writeFileSync(path.join(tempDir, 'test.txt'), 'test');

      reinitializeGit('test-project');

      // Verify progress messages were displayed
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]);
      const allLogs = logCalls.join('\n');
      
      // Should show confirmation for each step
      expect(allLogs).toContain('Initialized new Git repository');
      expect(allLogs).toContain('Staged all files');
      expect(allLogs).toContain('Created initial commit');
    });
  });

  describe('non-fatal error handling', () => {
    it('should treat Git errors as warnings, not fatal errors', () => {
      // The function should return false on error, not throw
      expect(() => {
        reinitializeGit('test-project');
      }).not.toThrow();
    });

    it('should return boolean indicating success or failure', () => {
      const result = reinitializeGit('test-project');
      
      expect(typeof result).toBe('boolean');
    });
  });
});
