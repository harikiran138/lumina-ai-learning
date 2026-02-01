#!/usr/bin/env node
/**
 * Frontend Error Scanner
 * Scans TypeScript/React files for errors and issues.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function printHeader(text) {
  console.log(`\n${colors.blue}${"=".repeat(60)}`);
  console.log(text);
  console.log(`${"=".repeat(60)}${colors.reset}\n`);
}

function printSuccess(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

function printError(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

function printWarning(text) {
  console.log(`${colors.yellow}⚠ ${text}${colors.reset}`);
}

function runCommand(command, description) {
  printHeader(description);
  try {
    const output = execSync(command, { encoding: "utf-8", stdio: "pipe" });
    if (output.trim()) {
      console.log(output);
    }
    printSuccess(`${description} completed successfully!`);
    return { success: true, output };
  } catch (error) {
    printError(`${description} failed!`);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.log(error.stderr);
    return { success: false, error: error.message };
  }
}

function checkTypeScript() {
  printHeader("Checking TypeScript Compilation");
  try {
    execSync("npx tsc --noEmit", { encoding: "utf-8", stdio: "pipe" });
    printSuccess("No TypeScript errors found!");
    return { success: true, errors: 0 };
  } catch (error) {
    const output = error.stdout || error.stderr || "";
    const errorCount = (output.match(/error TS/g) || []).length;
    printError(`Found ${errorCount} TypeScript errors:`);
    console.log(output);
    return { success: false, errors: errorCount };
  }
}

function runESLint() {
  printHeader("Running ESLint");
  try {
    execSync("npm run lint", { encoding: "utf-8", stdio: "pipe" });
    printSuccess("No ESLint errors found!");
    return { success: true, errors: 0 };
  } catch (error) {
    const output = error.stdout || error.stderr || "";
    const errorLines = output
      .split("\n")
      .filter((line) => line.includes("error") || line.includes("warning"));
    printWarning(`ESLint found ${errorLines.length} issues:`);
    console.log(output);
    return { success: false, errors: errorLines.length };
  }
}

function checkBuildSize() {
  printHeader("Checking Build Configuration");

  const nextConfigPath = path.join(process.cwd(), "next.config.js");
  const nextConfigMjsPath = path.join(process.cwd(), "next.config.mjs");

  if (fs.existsSync(nextConfigPath) || fs.existsSync(nextConfigMjsPath)) {
    printSuccess("Next.js config found");
    return { success: true };
  } else {
    printWarning("Next.js config not found");
    return { success: false };
  }
}

function checkDependencies() {
  printHeader("Checking Dependencies");
  try {
    execSync("npm ls --depth=0", { encoding: "utf-8", stdio: "pipe" });
    printSuccess("All dependencies are installed correctly!");
    return { success: true };
  } catch (error) {
    printWarning("Some dependency issues found:");
    console.log(error.stdout || error.message);
    return { success: false };
  }
}

function scanUnusedDependencies() {
  printHeader("Scanning for Unused Dependencies");
  try {
    // Check if depcheck is installed
    execSync("npx depcheck --version", { stdio: "pipe" });
    const output = execSync("npx depcheck --json", { encoding: "utf-8" });
    const result = JSON.parse(output);

    if (result.dependencies && result.dependencies.length > 0) {
      printWarning(`Found ${result.dependencies.length} unused dependencies:`);
      result.dependencies.forEach((dep) => console.log(`  - ${dep}`));
      return { success: false, unused: result.dependencies.length };
    } else {
      printSuccess("No unused dependencies found!");
      return { success: true, unused: 0 };
    }
  } catch (error) {
    printWarning(
      "depcheck not available. Install with: npm install -g depcheck",
    );
    return { success: true, unused: 0 };
  }
}

function generateReport(results) {
  printHeader("SCAN SUMMARY");

  console.log(
    `TypeScript: ${
      results.typescript.success
        ? "✓ PASS"
        : `✗ FAIL (${results.typescript.errors} errors)`
    }`,
  );
  console.log(
    `ESLint: ${
      results.eslint.success
        ? "✓ PASS"
        : `✗ FAIL (${results.eslint.errors} issues)`
    }`,
  );
  console.log(
    `Build Config: ${results.buildConfig.success ? "✓ PASS" : "✗ FAIL"}`,
  );
  console.log(
    `Dependencies: ${results.dependencies.success ? "✓ PASS" : "✗ FAIL"}`,
  );
  console.log(
    `Unused Deps: ${
      results.unusedDeps.unused === 0
        ? "✓ PASS"
        : `⚠ ${results.unusedDeps.unused} found`
    }`,
  );

  const totalErrors =
    (results.typescript.errors || 0) + (results.eslint.errors || 0);

  console.log(`\n${colors.blue}Total Errors: ${totalErrors}${colors.reset}`);

  if (
    totalErrors === 0 &&
    results.buildConfig.success &&
    results.dependencies.success
  ) {
    console.log(
      `\n${colors.green}🎉 All checks passed! Your code looks good!${colors.reset}`,
    );
  } else {
    console.log(
      `\n${colors.yellow}⚠️  Please fix the issues above before deploying.${colors.reset}`,
    );
  }

  return totalErrors === 0;
}

function main() {
  console.log(`${colors.blue}Frontend Error Scanner${colors.reset}`);
  console.log(`Scanning directory: ${process.cwd()}\n`);

  const results = {
    typescript: checkTypeScript(),
    eslint: runESLint(),
    buildConfig: checkBuildSize(),
    dependencies: checkDependencies(),
    unusedDeps: scanUnusedDependencies(),
  };

  const success = generateReport(results);
  process.exit(success ? 0 : 1);
}

main();
