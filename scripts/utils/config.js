const fs = require('fs');
const path = require('path');
const { z } = require('zod');

const { parseJsonFile } = require('./json');
const { configDir } = require('./paths');

const personalConfigSchema = z.object({
  name: z.string(),
});

function readPersonalConfig() {
  const personalConfigPath = path.join(configDir, 'personal-config.json');
  if (!fs.existsSync(personalConfigPath)) {
    throw new Error('Error: personal-config.json not found at .agentic-coding/config/personal-config.json.');
  }
  
  const personalConfig = personalConfigSchema.parse(parseJsonFile(personalConfigPath));

  return personalConfig;
}

const projectConfigSchema = z.object({
  git: z.object({
    rootBranch: z.string(),
    branchNaming: z.string()
  }),
});

function readProjectConfig() {
  const projectConfigPath = path.join(configDir, 'project-config.json');
  if (!fs.existsSync(projectConfigPath)) {
    throw new Error('Error: project-config.json not found at .agentic-coding/config/project-config.json.');
  }

  const projectConfig = projectConfigSchema.parse(parseJsonFile(projectConfigPath));

  return projectConfig;
}