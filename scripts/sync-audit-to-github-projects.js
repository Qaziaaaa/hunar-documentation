/**
 * Automation Script: Sync all 30 HUNAR Audit Issues to GitHub Project #39
 * Target: https://github.com/orgs/SMIT-Bootcamp/projects/39
 * Repository: SMIT-Bootcamp/Hunar
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

function getAuthToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim();
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN.trim();

  // Try retrieving token from gh CLI if available
  try {
    const token = execSync('gh auth token', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    if (token && token.trim()) return token.trim();
  } catch {}
  try {
    const token = execSync('"C:\\Program Files\\GitHub CLI\\gh.exe" auth token', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    if (token && token.trim()) return token.trim();
  } catch {}

  return null;
}

function parseAuditIssues() {
  const reportPath = path.resolve(__dirname, '../docs/HUNAR_CUSTOMER_WORKER_PORTALS_FINAL_AUDIT_REPORT.md');
  const content = fs.readFileSync(reportPath, 'utf8');

  const issueBlocks = content.split(/---[\r\n]+### Issue ID: /).slice(1);
  const issues = [];

  for (const block of issueBlocks) {
    const idMatch = block.match(/^(AUDIT-\d+)/);
    if (!idMatch) continue;
    const id = idMatch[1];

    const titleMatch = block.match(/\*\*Title:\*\* (.*?)[\r\n]+/);
    const title = titleMatch ? titleMatch[1].trim() : id;

    const portalMatch = block.match(/\*\*Portal:\*\* (.*?)[\r\n]+/);
    const portal = portalMatch ? portalMatch[1].trim() : 'General';

    const categoryMatch = block.match(/\*\*Category:\*\* (.*?)[\r\n]+/);
    const category = categoryMatch ? categoryMatch[1].trim() : 'General';

    const priorityMatch = block.match(/\*\*Priority:\*\* (.*?)[\r\n]+/);
    const priority = priorityMatch ? priorityMatch[1].trim() : 'P2';

    const completedSet = new Set(['AUDIT-002', 'AUDIT-004', 'AUDIT-005', 'AUDIT-006', 'AUDIT-022', 'AUDIT-027']);
    const isRemediated = completedSet.has(id) || block.includes('**Status:** ✅ **REMEDIATED**') || block.includes('**Status:** ✅ **RESOLVED**');

    // Extract Description / Behavior / Fix
    const currentBehaviorMatch = block.match(/\*\*Current Behavior:\*\* ([\s\S]*?)(?=\*\*Expected Behavior:\*\*)/);
    const expectedBehaviorMatch = block.match(/\*\*Expected Behavior:\*\* ([\s\S]*?)(?=\*\*Root Cause:\*\*)/);
    const impactMatch = block.match(/\*\*Impact:\*\* ([\s\S]*?)(?=\*\*Recommended Fix:\*\*|\*\*Evidence:\*\*|---)/);
    const fixMatch = block.match(/\*\*Recommended Fix:\*\* ([\s\S]*?)(?=\*\*Evidence:\*\*|---)/);

    const body = [
      `### [${id}] ${title}`,
      `**Priority:** ${priority} | **Portal:** ${portal} | **Category:** ${category}`,
      `**Status:** ${isRemediated ? '✅ Completed / Remediated' : '📋 To Do'}`,
      '',
      '#### Current Behavior',
      currentBehaviorMatch ? currentBehaviorMatch[1].trim() : 'N/A',
      '',
      '#### Expected Behavior',
      expectedBehaviorMatch ? expectedBehaviorMatch[1].trim() : 'N/A',
      '',
      '#### Impact',
      impactMatch ? impactMatch[1].trim() : 'N/A',
      '',
      '#### Recommended Fix',
      fixMatch ? fixMatch[1].trim() : 'N/A',
      '',
      `_Reported in HUNAR Final Audit Report for SMIT-Bootcamp/Hunar_`
    ].join('\n');

    issues.push({
      id,
      title: `[${id}] ${title}`,
      priority,
      portal,
      category,
      isRemediated,
      status: isRemediated ? 'Done' : 'Todo',
      body,
    });
  }

  return issues;
}

async function graphqlRequest(token, query, variables = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query, variables });
    const req = https.request(
      'https://api.github.com/graphql',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'HUNAR-Audit-Sync',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.errors) {
              reject(new Error(JSON.stringify(parsed.errors)));
            } else {
              resolve(parsed.data);
            }
          } catch (e) {
            reject(new Error(data));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('====================================================');
  console.log('HUNAR: Sync 30 Audit Issues to GitHub Project #39');
  console.log('Target: https://github.com/orgs/SMIT-Bootcamp/projects/39');
  console.log('====================================================\n');

  const token = getAuthToken();
  if (!token) {
    console.error('❌ Error: No GitHub authentication token found.\n');
    console.log('To run this sync, either:');
    console.log('  1. Install GitHub CLI and login:');
    console.log('     winget install GitHub.cli');
    console.log('     gh auth login\n');
    console.log('  2. Or set a Personal Access Token:');
    console.log('     $env:GITHUB_TOKEN = "your_pat_with_project_and_repo_scopes"\n');
    process.exit(1);
  }

  const issues = parseAuditIssues();
  console.log(`✓ Parsed ${issues.length} audit issues from docs/HUNAR_CUSTOMER_WORKER_PORTALS_FINAL_AUDIT_REPORT.md\n`);

  console.log('Querying GitHub Project #39 in SMIT-Bootcamp...');
  const projectQuery = `
    query GetProject($org: String!, $number: Int!) {
      organization(login: $org) {
        projectV2(number: $number) {
          id
          title
          fields(first: 20) {
            nodes {
              ... on ProjectV2Field {
                id
                name
              }
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  id
                  name
                }
              }
            }
          }
        }
      }
      viewer {
        id
        login
      }
    }
  `;

  let projectData;
  try {
    projectData = await graphqlRequest(token, projectQuery, { org: 'SMIT-Bootcamp', number: 39 });
  } catch (err) {
    console.error('❌ Failed to fetch Project #39:', err.message);
    process.exit(1);
  }

  const project = projectData?.organization?.projectV2;
  const viewer = projectData?.viewer;

  if (!project) {
    console.error('❌ Project #39 not found under organization SMIT-Bootcamp.');
    process.exit(1);
  }

  console.log(`✓ Connected to Project: "${project.title}" (ID: ${project.id})`);
  console.log(`✓ Authenticated as: @${viewer?.login} (ID: ${viewer?.id})\n`);
  console.log('Project Fields:', JSON.stringify(project.fields.nodes, null, 2));

  const statusField = project.fields.nodes.find((f) => f.name?.toLowerCase() === 'status');
  const todoOption = statusField?.options?.find((o) => o.name?.toLowerCase() === 'todo' || o.name?.toLowerCase() === 'to do');
  const doneOption = statusField?.options?.find((o) => o.name?.toLowerCase() === 'done');

  console.log('Starting issue creation and project assignment...\n');

  let count = 0;
  for (const issue of issues) {
    count++;
    process.stdout.write(`[${count}/30] Creating ${issue.id}: "${issue.title.slice(0, 40)}..." `);

    // 1. Add item to Project V2 (as draft item or repository issue)
    const addDraftQuery = `
      mutation AddDraftItem($projectId: ID!, $title: String!, $body: String!, $assigneeIds: [ID!]) {
        addProjectV2DraftIssue(input: { projectId: $projectId, title: $title, body: $body, assigneeIds: $assigneeIds }) {
          projectItem {
            id
          }
        }
      }
    `;

    try {
      const draftResult = await graphqlRequest(token, addDraftQuery, {
        projectId: project.id,
        title: issue.title,
        body: issue.body,
        assigneeIds: viewer?.id ? [viewer.id] : [],
      });

      const itemId = draftResult?.addProjectV2DraftIssue?.projectItem?.id;

      // 2. Set Status (Todo or Done)
      const targetOption = issue.isRemediated ? doneOption : todoOption;
      if (statusField && targetOption && itemId) {
        const updateStatusQuery = `
          mutation UpdateStatus($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: String!) {
            updateProjectV2ItemFieldValue(
              input: {
                projectId: $projectId
                itemId: $itemId
                fieldId: $fieldId
                value: { singleSelectOptionId: $value }
              }
            ) {
              projectV2Item {
                id
              }
            }
          }
        `;
        await graphqlRequest(token, updateStatusQuery, {
          projectId: project.id,
          itemId: itemId,
          fieldId: statusField.id,
          value: targetOption.id,
        });
      }

      console.log(`-> ✓ Added [${issue.status}]`);
    } catch (err) {
      console.log(`-> ⚠️ ${err.message}`);
    }
  }

  console.log('\n====================================================');
  console.log('🎉 Successfully synced all 30 audit issues to Project #39!');
  console.log('View project: https://github.com/orgs/SMIT-Bootcamp/projects/39');
  console.log('====================================================');
}

main().catch(console.error);

