# Angular Starter 🚀

A starter project based on **Angular 20 Zoneless**, **Tailwind CSS**, and **DaisyUI**.

## Key Features

* **Angular 20 Zoneless**: leverages the zoneless approach to improve performance and reduce overhead.
* **Tailwind CSS**: a utility-first CSS framework for fast and highly customizable styling.
* **DaisyUI**: ready-to-use UI components built on top of Tailwind, ensuring modern and accessible interfaces.
* **Modular structure**: a scalable base organized for easy extension of features and components.

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/angular-starter.git
cd angular-starter
npm install
# or
yarn install
```

## Renaming the Project

This starter project includes a convenient script to rename the entire project to match your needs. The script will automatically update all configuration files and optionally reinitialize the Git repository for a fresh start.

### How to Rename

1. **Run the rename script:**
   ```bash
   npm run rename
   ```

2. **Follow the prompts:**
   - The script will display the current project name
   - Enter your desired new project name when prompted
   - The script will validate your input and update all files

3. **Optional: Reinitialize Git repository**
   
   If you want to start with a clean Git history:
   ```bash
   node rename-project.js --git-reset
   ```
   
   This will:
   - Remove the existing `.git` directory
   - Initialize a new Git repository
   - Create an initial commit with your new project name

### Valid Project Names

Project names must follow the **kebab-case** format:

✅ **Valid examples:**
- `my-awesome-app`
- `todo-list`
- `angular-dashboard-v2`
- `ecommerce-platform`

❌ **Invalid examples:**
- `MyApp` (must be lowercase)
- `my_app` (use hyphens, not underscores)
- `123-app` (must start with a letter)
- `-my-app` or `my-app-` (cannot start or end with a hyphen)

### What Gets Modified

The rename script automatically updates the following files:

- **`package.json`**: Updates the `name` field and removes the rename script
- **`angular.json`**: Updates the project key and all buildTarget references
- **`README.md`**: Replaces all project name references and removes this renaming section

### Important Notes

⚠️ **This section will be automatically removed** after you run the rename script successfully. The script will clean up all references to itself, leaving you with a clean README for your newly named project.

💡 **Tip**: Make sure to commit any pending changes before running the script, especially if using the `--git-reset` flag.

## Available Scripts

| Command         | Description                                              |
| --------------- | -------------------------------------------------------- |
| `npm run dev`   | Starts the development server at `http://localhost:4200` |
| `npm run build` | Builds the app for production into `dist/`               |
| `npm test`      | Runs unit tests                                          |
| `npm run rename`| Renames the project (updates all configuration files)    |

> ⚙️ You can replace `npm` with `yarn` if preferred.

## Project Structure

```text
angular-starter/
├── src/
│   ├── app/
|   |  ├── layout/        # Base layout UI components
│   │  ├── features/      # Features 
│   │  └── app.ts
│   ├── assets/            # Static assets
│   ├── styles.css         # Tailwind directives
│   └── main.ts            # Zoneless bootstrap
├── angular.json
├── package.json
└── README.md
```

[Alessandro Umek ©](https://alessandroumek.it)
