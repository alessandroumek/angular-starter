#!/usr/bin/env node

/**
 * Project Rename Script
 * 
 * This script automates the process of renaming an Angular project by:
 * - Validating the new project name (kebab-case format)
 * - Updating package.json, angular.json, and README.md
 * - Optionally reinitializing the Git repository (with --git-reset flag)
 * - Cleaning up references to this script after execution
 * 
 * The script is designed to be run once during project setup, and will
 * automatically remove itself from the project after successful execution.
 * 
 * Usage:
 *   node rename-project.js           # Basic rename (no Git reinitialization)
 *   node rename-project.js --git-reset  # Rename with Git reinitialization
 *   npm run rename                   # Via npm script (if configured)
 * 
 * Exit Codes:
 *   0 - Success: All operations completed successfully
 *   1 - Validation error or critical files missing
 *   2 - File update error (critical file update failed)
 *   3 - Git error (non-fatal, files were updated but Git operations failed)
 * 
 * Requirements:
 *   - Node.js (built-in modules only, no external dependencies)
 *   - package.json must exist in the project root
 *   - Git (optional, only required if using --git-reset flag)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// ============================================================================
// Configuration
// ============================================================================

/**
 * Regular expression pattern for validating project names.
 * 
 * Pattern breakdown:
 * - ^[a-z]           : Must start with a lowercase letter
 * - [a-z0-9]*        : Followed by zero or more lowercase letters or numbers
 * - (-[a-z0-9]+)*    : Followed by zero or more groups of (hyphen + one or more lowercase letters/numbers)
 * - $                : End of string
 * 
 * Valid examples: my-project, angular-app, todo-list-v2, app
 * Invalid examples: MyProject, -project, project-, 123project
 */
const PROJECT_NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * Default file paths for project configuration files.
 * All paths are relative to the current working directory (project root).
 * 
 * These paths are used as defaults but can be overridden in function calls
 * to support testing with different directory structures.
 */
const paths = {
  packageJson: path.join(process.cwd(), 'package.json'),
  angularJson: path.join(process.cwd(), 'angular.json'),
  readme: path.join(process.cwd(), 'README.md'),
  gitDir: path.join(process.cwd(), '.git')
};

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates a project name against kebab-case format requirements.
 * 
 * Rules:
 * - Must start with a lowercase letter
 * - Can contain lowercase letters, numbers, and hyphens
 * - Cannot start or end with a hyphen
 * - Cannot be empty
 * 
 * The validation uses a regular expression to ensure the name follows
 * the kebab-case convention commonly used in web projects.
 * 
 * @param {string} name - The project name to validate
 * @returns {{ valid: boolean, error: string | null }} Validation result
 * 
 * @example
 * validateProjectName('my-project')      // { valid: true, error: null }
 * validateProjectName('MyProject')       // { valid: false, error: '...' }
 * validateProjectName('123-project')     // { valid: false, error: '...' }
 * validateProjectName('')                // { valid: false, error: 'Project name cannot be empty' }
 */
function validateProjectName(name) {
  // Check for empty or whitespace-only names
  if (!name || name.trim() === '') {
    return {
      valid: false,
      error: 'Project name cannot be empty'
    };
  }

  // Test against the kebab-case pattern
  if (!PROJECT_NAME_PATTERN.test(name)) {
    return {
      valid: false,
      error: `Invalid project name: "${name}"\n` +
             '   Project names must:\n' +
             '   - Be in kebab-case format\n' +
             '   - Start with a lowercase letter\n' +
             '   - Contain only lowercase letters, numbers, and hyphens\n' +
             '   - Not start or end with a hyphen\n\n' +
             '   Examples: my-project, angular-app, todo-list-v2'
    };
  }

  // Name is valid
  return { valid: true, error: null };
}

// ============================================================================
// File Operations
// ============================================================================

/**
 * Reads the current project name from package.json.
 * 
 * @param {string} [packageJsonPath] - Optional path to package.json (defaults to project root)
 * @returns {string | null} The current project name, or null if not found
 * @throws {Error} If package.json doesn't exist or is malformed
 */
function getCurrentProjectName(packageJsonPath) {
  const pkgPath = packageJsonPath || paths.packageJson;
  
  // Verify that package.json exists
  // This is a critical check - we cannot proceed without this file
  if (!fs.existsSync(pkgPath)) {
    throw new Error('package.json not found. This script must be run from the project root.');
  }

  try {
    // Read and parse the package.json file
    const content = fs.readFileSync(pkgPath, 'utf8');
    const packageData = JSON.parse(content);

    // Verify that the "name" field exists
    // Every valid package.json should have a name field
    if (!packageData.name) {
      throw new Error('package.json does not contain a "name" field.');
    }

    return packageData.name;
  } catch (error) {
    // Handle JSON parsing errors separately to provide a more helpful error message
    if (error instanceof SyntaxError) {
      throw new Error('package.json is malformed and cannot be parsed.');
    }
    // Re-throw other errors (like missing "name" field)
    throw error;
  }
}

/**
 * Updates the package.json file with the new project name.
 * Also removes the "rename" script from the scripts section.
 * 
 * @param {string} oldName - The current project name (not used but kept for consistency)
 * @param {string} newName - The new project name
 * @param {string} [packageJsonPath] - Optional path to package.json (defaults to project root)
 * @returns {boolean} True if update was successful, false otherwise
 * 
 * @example
 * updatePackageJson('old-project', 'new-project')  // Updates name and removes rename script
 */
function updatePackageJson(oldName, newName, packageJsonPath) {
  const pkgPath = packageJsonPath || paths.packageJson;
  
  try {
    // Parse the JSON content
    const content = fs.readFileSync(pkgPath, 'utf8');
    const packageData = JSON.parse(content);

    // Update the name field with the new project name
    packageData.name = newName;

    // Remove the "rename" script from the scripts section
    // This ensures the rename script is not available after the project is renamed
    if (packageData.scripts && packageData.scripts.rename) {
      delete packageData.scripts.rename;
    }

    // Write back to file with 2-space indentation and trailing newline
    // The trailing newline ensures the file ends with a newline character (POSIX standard)
    fs.writeFileSync(pkgPath, JSON.stringify(packageData, null, 2) + '\n', 'utf8');

    return true;
  } catch (error) {
    showError(`Error updating package.json: ${error.message}`);
    return false;
  }
}

/**
 * Updates the angular.json file with the new project name.
 * Renames the project key under "projects" and updates all buildTarget references.
 * 
 * @param {string} oldName - The current project name
 * @param {string} newName - The new project name
 * @param {string} [angularJsonPath] - Optional path to angular.json (defaults to project root)
 * @returns {boolean} True if update was successful, false otherwise
 * 
 * @example
 * updateAngularJson('old-project', 'new-project')  // Renames project key and updates buildTargets
 */
function updateAngularJson(oldName, newName, angularJsonPath) {
  const angularPath = angularJsonPath || paths.angularJson;
  
  // Check if angular.json exists
  if (!fs.existsSync(angularPath)) {
    showWarning('angular.json not found. Skipping Angular configuration update.');
    return false;
  }

  try {
    // Parse the JSON content
    const content = fs.readFileSync(angularPath, 'utf8');
    const angularData = JSON.parse(content);

    // Check if projects section exists
    if (!angularData.projects) {
      showWarning('angular.json does not contain a "projects" section. Skipping update.');
      return false;
    }

    // Check if the old project name exists in projects
    if (!angularData.projects[oldName]) {
      showWarning(`Project "${oldName}" not found in angular.json. Skipping update.`);
      return false;
    }

    // Rename the project key by copying the old project config to the new key
    // and then deleting the old key
    angularData.projects[newName] = angularData.projects[oldName];
    delete angularData.projects[oldName];

    // Update all buildTarget references throughout the entire configuration
    // BuildTarget references follow the pattern "projectName:targetName" (e.g., "my-app:build")
    // We need to update these references wherever they appear in the configuration
    // 
    // Strategy: Convert to string, replace all occurrences, then parse back
    // This ensures we catch all references regardless of their location in the config
    let jsonString = JSON.stringify(angularData, null, 2);
    
    // Replace buildTarget references like "oldName:build" -> "newName:build"
    // This regex matches the old project name followed by a colon (buildTarget pattern)
    const buildTargetPattern = new RegExp(`"${oldName}:`, 'g');
    jsonString = jsonString.replace(buildTargetPattern, `"${newName}:`);

    // Parse back to ensure valid JSON before writing
    const updatedData = JSON.parse(jsonString);

    // Write back to file with 2-space indentation and trailing newline
    fs.writeFileSync(angularPath, JSON.stringify(updatedData, null, 2) + '\n', 'utf8');

    return true;
  } catch (error) {
    showError(`Error updating angular.json: ${error.message}`);
    return false;
  }
}

/**
 * Updates the README.md file with the new project name.
 * Replaces all occurrences of the old name, removes the "Renaming the Project" section,
 * and removes references to the rename script.
 * 
 * @param {string} oldName - The current project name
 * @param {string} newName - The new project name
 * @param {string} [readmePath] - Optional path to README.md (defaults to project root)
 * @returns {boolean} True if update was successful, false otherwise
 * 
 * @example
 * updateReadme('old-project', 'new-project')  // Updates all references and removes rename section
 */
function updateReadme(oldName, newName, readmePath) {
  const readmeMdPath = readmePath || paths.readme;
  
  // Check if README.md exists
  if (!fs.existsSync(readmeMdPath)) {
    showWarning('README.md not found. Skipping README update.');
    return false;
  }

  try {
    // Read the current README.md content
    let content = fs.readFileSync(readmeMdPath, 'utf8');

    // Step 1: Remove the "Renaming the Project" section
    // This section was added to document the rename script, but should be removed
    // after the script has been executed to keep the README clean
    // 
    // Find the section starting with "## Renaming the Project"
    const renameSectionStart = '## Renaming the Project';
    const startIndex = content.indexOf(renameSectionStart);
    
    if (startIndex !== -1) {
      // Find the next section marker (##) after the rename section
      // This tells us where the rename section ends
      const afterStart = content.substring(startIndex + renameSectionStart.length);
      const nextSectionMatch = afterStart.match(/\n##\s/);
      
      if (nextSectionMatch) {
        // Remove everything from the start of the rename section to the start of the next section
        const endIndex = startIndex + renameSectionStart.length + nextSectionMatch.index;
        content = content.substring(0, startIndex) + content.substring(endIndex + 1);
      } else {
        // No next section found, remove everything from the rename section to the end
        content = content.substring(0, startIndex);
      }
    }

    // Step 2: Remove lines that mention "rename-project" or "npm run rename"
    // These are references to the rename script that should be removed after execution
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => {
      const lowerLine = line.toLowerCase();
      return !lowerLine.includes('rename-project') && !lowerLine.includes('npm run rename');
    });
    content = filteredLines.join('\n');

    // Step 3: Replace all occurrences of the old name with the new name
    // Use a global regex to replace all occurrences throughout the document
    // We escape the old name to handle any special regex characters it might contain
    const namePattern = new RegExp(escapeRegExp(oldName), 'g');
    content = content.replace(namePattern, newName);

    // Write back to file, preserving the original structure
    fs.writeFileSync(readmeMdPath, content, 'utf8');

    return true;
  } catch (error) {
    showError(`Error updating README.md: ${error.message}`);
    return false;
  }
}

/**
 * Escapes special regex characters in a string.
 * Used to safely create regex patterns from user input.
 * 
 * This function escapes all special characters that have meaning in regular expressions:
 * . * + ? ^ $ { } ( ) | [ ] \
 * 
 * @param {string} string - The string to escape
 * @returns {string} The escaped string safe for use in regex
 * 
 * @example
 * escapeRegExp('my-project')        // 'my\\-project'
 * escapeRegExp('project.name')      // 'project\\.name'
 * escapeRegExp('test[123]')         // 'test\\[123\\]'
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// User Interaction
// ============================================================================

/**
 * Singleton readline interface for user input.
 * Cached to avoid creating multiple interfaces.
 * Exported for testing purposes.
 * 
 * @type {readline.Interface | null}
 */
let rl = null;

/**
 * Gets or creates the readline interface.
 * Uses a singleton pattern to ensure only one interface exists.
 * 
 * @returns {readline.Interface} The readline interface for stdin/stdout
 * 
 * @example
 * const rl = getReadlineInterface()
 * rl.question('Enter name: ', (answer) => {
 *   console.log(`You entered: ${answer}`)
 * })
 */
function getReadlineInterface() {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  return rl;
}

/**
 * Prompts the user with a question and returns their answer.
 * Uses the readline interface to get synchronous-style input in an async context.
 * 
 * @param {string} question - The question to ask
 * @param {readline.Interface} [readlineInterface] - Optional readline interface for testing
 * @returns {Promise<string>} The user's answer (trimmed of leading/trailing whitespace)
 * 
 * @example
 * const name = await prompt('Enter your name: ')
 * console.log(`Hello, ${name}!`)
 */
function prompt(question, readlineInterface) {
  const rlInterface = readlineInterface || getReadlineInterface();
  return new Promise(resolve => {
    rlInterface.question(question, answer => {
      // Trim whitespace from the answer to handle accidental spaces
      resolve(answer.trim());
    });
  });
}

/**
 * Prompts the user for a new project name with validation.
 * Continues prompting until a valid name is provided.
 * 
 * @param {string} currentName - The current project name
 * @param {readline.Interface} [readlineInterface] - Optional readline interface for testing
 * @returns {Promise<string>} The validated new project name
 */
async function promptForNewName(currentName, readlineInterface) {
  // Display welcome banner with script information
  console.log('\n' + '='.repeat(60));
  console.log('  PROJECT RENAME SCRIPT');
  console.log('='.repeat(60));
  console.log(`\nCurrent project name: ${currentName}`);
  console.log('\nThis script will update:');
  console.log('  • package.json');
  console.log('  • angular.json');
  console.log('  • README.md');
  console.log('\n' + '='.repeat(60) + '\n');

  // Validation loop: continue prompting until a valid name is provided
  // This ensures we never proceed with an invalid project name
  while (true) {
    const newName = await prompt('Enter new project name (kebab-case): ', readlineInterface);
    const validation = validateProjectName(newName);

    // If the name is valid, return it and exit the loop
    if (validation.valid) {
      return newName;
    }

    // If the name is invalid, show the error message and continue the loop
    // The error message includes detailed information about what went wrong
    // and examples of valid names to help the user
    console.log(`\n❌ ${validation.error}\n`);
  }
}

// ============================================================================
// Output Functions
// ============================================================================

/**
 * Displays a success message with a checkmark symbol.
 * Used to indicate successful operations to the user.
 * 
 * @param {string} message - The message to display
 * 
 * @example
 * showSuccess('Updated package.json')
 * // Output: ✓ Updated package.json
 */
function showSuccess(message) {
  console.log(`✓ ${message}`);
}

/**
 * Displays a warning message with a warning symbol.
 * Used for non-fatal issues that the user should be aware of.
 * 
 * @param {string} message - The message to display
 * 
 * @example
 * showWarning('angular.json not found. Skipping Angular configuration update.')
 * // Output: ⚠️  angular.json not found. Skipping Angular configuration update.
 */
function showWarning(message) {
  console.log(`⚠️  ${message}`);
}

/**
 * Displays an error message with an error symbol.
 * Used for errors and failures that require user attention.
 * 
 * @param {string} message - The message to display
 * 
 * @example
 * showError('Error updating package.json: EACCES: permission denied')
 * // Output: ❌ Error updating package.json: EACCES: permission denied
 */
function showError(message) {
  console.log(`❌ ${message}`);
}

// ============================================================================
// File Verification
// ============================================================================

/**
 * Verifies that required files exist and checks for optional files.
 * 
 * Required files:
 * - package.json (throws error if missing)
 * 
 * Optional files:
 * - angular.json (shows warning if missing)
 * - README.md (shows warning if missing)
 * 
 * @returns {{ packageJson: boolean, angularJson: boolean, readme: boolean }} Object indicating which files are available
 * @throws {Error} If package.json is not found
 * 
 * @example
 * const availableFiles = verifyRequiredFiles()
 * // { packageJson: true, angularJson: true, readme: false }
 */
function verifyRequiredFiles() {
  const availableFiles = {
    packageJson: false,
    angularJson: false,
    readme: false
  };

  // Compute paths dynamically to support testing with changed working directory
  // This ensures the script works correctly even when the working directory changes
  const currentPaths = {
    packageJson: path.join(process.cwd(), 'package.json'),
    angularJson: path.join(process.cwd(), 'angular.json'),
    readme: path.join(process.cwd(), 'README.md')
  };

  // Check package.json (required)
  // This is the only file that is absolutely required for the script to run
  // If it doesn't exist, we throw an error and stop execution
  if (!fs.existsSync(currentPaths.packageJson)) {
    throw new Error('package.json not found. This script must be run from the project root.');
  }
  availableFiles.packageJson = true;

  // Check angular.json (optional)
  // If this file doesn't exist, we show a warning but continue
  // This allows the script to work with non-Angular projects
  if (!fs.existsSync(currentPaths.angularJson)) {
    showWarning('angular.json not found. Angular configuration will not be updated.');
  } else {
    availableFiles.angularJson = true;
  }

  // Check README.md (optional)
  // If this file doesn't exist, we show a warning but continue
  // The script can still rename the project without updating the README
  if (!fs.existsSync(currentPaths.readme)) {
    showWarning('README.md not found. README will not be updated.');
  } else {
    availableFiles.readme = true;
  }

  return availableFiles;
}

// ============================================================================
// Git Operations
// ============================================================================

/**
 * Checks if Git is available on the system.
 * 
 * @returns {boolean} True if Git is available, false otherwise
 * 
 * @example
 * if (checkGitAvailability()) {
 *   console.log('Git is available');
 * } else {
 *   console.log('Git is not available');
 * }
 */
function checkGitAvailability() {
  try {
    // Try to execute 'git --version' command
    // If Git is installed and available in PATH, this will succeed
    // We use stdio: 'ignore' to suppress output since we only care about success/failure
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    // If the command fails, Git is not available
    // This could mean Git is not installed or not in the system PATH
    return false;
  }
}

/**
 * Reinitializes the Git repository with a fresh history.
 * 
 * This function:
 * 1. Checks if Git is available on the system
 * 2. Removes the existing .git directory (if present)
 * 3. Initializes a new Git repository
 * 4. Stages all files
 * 5. Creates an initial commit with the new project name
 * 
 * Errors are handled gracefully with warnings - Git reinitialization
 * is not considered a fatal error for the rename process.
 * 
 * @param {string} newProjectName - The new project name to use in the initial commit message
 * @returns {boolean} True if Git reinitialization was successful, false otherwise
 * 
 * @example
 * if (reinitializeGit('my-new-project')) {
 *   console.log('Git repository reinitialized');
 * } else {
 *   console.log('Git reinitialization skipped or failed');
 * }
 */
function reinitializeGit(newProjectName) {
  // Check if Git is available
  if (!checkGitAvailability()) {
    showWarning('Git is not available on this system. Skipping repository reinitialization.');
    showWarning('You can manually initialize Git later with: git init');
    return false;
  }

  try {
    // Step 1: Remove existing .git directory if it exists
    // This deletes the entire Git history, allowing for a fresh start
    // Compute gitDir dynamically to support testing with changed working directory
    const gitDir = path.join(process.cwd(), '.git');
    if (fs.existsSync(gitDir)) {
      try {
        // Use rmSync with recursive and force options to ensure complete removal
        fs.rmSync(gitDir, { recursive: true, force: true });
        console.log('  • Removed existing .git directory');
      } catch (error) {
        showWarning(`Could not remove .git directory: ${error.message}`);
        return false;
      }
    }

    // Step 2: Initialize new Git repository
    // This creates a new .git directory with a clean history
    try {
      execSync('git init', { stdio: 'pipe' });
      console.log('  • Initialized new Git repository');
    } catch (error) {
      showWarning(`Could not initialize Git repository: ${error.message}`);
      return false;
    }

    // Step 3: Stage all files
    // This adds all files in the project to the Git staging area
    try {
      execSync('git add .', { stdio: 'pipe' });
      console.log('  • Staged all files');
    } catch (error) {
      showWarning(`Could not stage files: ${error.message}`);
      return false;
    }

    // Step 4: Create initial commit
    // This creates the first commit in the new repository with the new project name
    try {
      const commitMessage = `Initial commit: ${newProjectName}`;
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'pipe' });
      console.log(`  • Created initial commit: "${commitMessage}"`);
    } catch (error) {
      showWarning(`Could not create initial commit: ${error.message}`);
      return false;
    }

    return true;
  } catch (error) {
    showWarning(`Git reinitialization failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// Main Function (Placeholder)
// ============================================================================

/**
 * Main entry point for the script.
 * Orchestrates the entire rename process from start to finish.
 * 
 * Process flow:
 * 1. Parse command line arguments (--git-reset flag)
 * 2. Verify required files exist (package.json is mandatory)
 * 3. Read current project name from package.json
 * 4. Prompt user for new project name with validation
 * 5. Update all configuration files (package.json, angular.json, README.md)
 * 6. Optionally reinitialize Git repository (if --git-reset flag is present)
 * 7. Display summary of changes
 * 8. Exit with appropriate status code
 * 
 * Exit codes:
 * - 0: Success - all operations completed successfully
 * - 1: Validation error or critical files missing (package.json)
 * - 2: File update error - critical file update failed
 * - 3: Git error (non-fatal) - files updated but Git operations failed
 * 
 * @async
 * @returns {Promise<void>} Resolves when the script completes
 * 
 * @example
 * // Basic usage (no Git reinitialization)
 * node rename-project.js
 * 
 * @example
 * // With Git reinitialization
 * node rename-project.js --git-reset
 */
async function main() {
  try {
    // Parse command line arguments
    // Look for the --git-reset flag which enables Git reinitialization
    const args = process.argv.slice(2);
    const shouldResetGit = args.includes('--git-reset');

    // Verify required files exist
    // This will throw an error if package.json is missing (exit code 1)
    // Optional files (angular.json, README.md) will show warnings but not stop execution
    verifyRequiredFiles();

    // Get current project name from package.json
    // This will throw an error if package.json is malformed (exit code 1)
    const currentName = getCurrentProjectName();

    // Prompt for new name with validation loop
    // This will continue prompting until a valid kebab-case name is provided
    const newName = await promptForNewName(currentName);

    console.log('\nUpdating project files...\n');

    // Track file update results
    // We need to know if critical files (package.json) failed to update
    let fileUpdateFailed = false;

    // Update all configuration files
    // Each function returns true on success, false on failure
    
    // Update package.json (critical - must succeed)
    const packageJsonUpdated = updatePackageJson(currentName, newName);
    if (packageJsonUpdated) {
      showSuccess('Updated package.json');
    } else {
      fileUpdateFailed = true;
    }

    // Update angular.json (optional - failure is not critical)
    const angularJsonUpdated = updateAngularJson(currentName, newName);
    if (angularJsonUpdated) {
      showSuccess('Updated angular.json');
    }

    // Update README.md (optional - failure is not critical)
    const readmeUpdated = updateReadme(currentName, newName);
    if (readmeUpdated) {
      showSuccess('Updated README.md');
    }

    // If critical file updates failed, exit with code 2
    // We cannot continue if package.json update failed
    if (fileUpdateFailed) {
      showError('Critical file update failed. Project rename incomplete.');
      const rl = getReadlineInterface();
      rl.close();
      process.exit(2);
    }

    // Handle Git reinitialization based on flag
    // This is optional and only runs if --git-reset flag was provided
    let gitFailed = false;
    if (shouldResetGit) {
      console.log('\nReinitializing Git repository...\n');
      const gitSuccess = reinitializeGit(newName);
      if (gitSuccess) {
        showSuccess('Git repository reinitialized');
      } else {
        gitFailed = true;
      }
    } else {
      console.log('\nℹ️  Git repository not reinitialized (use --git-reset flag to reinitialize)');
    }

    // Display success summary
    // Show the user what was accomplished
    console.log('\n' + '='.repeat(60));
    console.log('  RENAME COMPLETE');
    console.log('='.repeat(60));
    console.log(`\nProject renamed from "${currentName}" to "${newName}"`);
    console.log('\nFiles updated:');
    if (packageJsonUpdated) console.log('  ✓ package.json');
    if (angularJsonUpdated) console.log('  ✓ angular.json');
    if (readmeUpdated) console.log('  ✓ README.md');
    console.log('\n' + '='.repeat(60) + '\n');

    // Clean up readline interface
    const rl = getReadlineInterface();
    rl.close();

    // Exit with appropriate code
    // Git errors are non-fatal, so we exit with code 3 if Git failed but files were updated
    // Otherwise, exit with code 0 for complete success
    if (gitFailed) {
      process.exit(3);
    } else {
      process.exit(0);
    }
  } catch (error) {
    // Errors caught here are validation or critical file errors (exit code 1)
    // This includes: package.json not found, malformed JSON, validation failures
    showError(`Error: ${error.message}`);
    const rl = getReadlineInterface();
    rl.close();
    process.exit(1);
  }
}

// ============================================================================
// Script Execution
// ============================================================================

// Only run if this script is executed directly (not required as a module)
if (require.main === module) {
  main();
}

// Export functions for testing
module.exports = {
  validateProjectName,
  getCurrentProjectName,
  updatePackageJson,
  updateAngularJson,
  updateReadme,
  promptForNewName,
  showSuccess,
  showWarning,
  showError,
  verifyRequiredFiles,
  checkGitAvailability,
  reinitializeGit
};
