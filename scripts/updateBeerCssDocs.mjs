import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function updateBeerCssDocs() {
  try {
    // 1. Determine installed Beer CSS version
    let version = '3.13.3';
    try {
      const beercssPkgPath = path.join(rootDir, 'node_modules', 'beercss', 'package.json');
      if (fs.existsSync(beercssPkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(beercssPkgPath, 'utf8'));
        if (pkg.version) version = pkg.version;
      } else {
        const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
        const semver = rootPkg.dependencies?.beercss || rootPkg.devDependencies?.beercss;
        if (semver) version = semver.replace(/^[\^~]/, '');
      }
    } catch {
      // fallback to default
    }

    console.log(`[beercss-docs] Target Beer CSS version: ${version}`);

    // 2. Fetch version-bound llms.md
    const targetUrl = `https://raw.githubusercontent.com/beercss/beercss/v${version}/llms.md`;
    const fallbackUrl = 'https://raw.githubusercontent.com/beercss/beercss/main/llms.md';

    let markdown = '';
    let fetchedUrl = '';

    try {
      console.log(`[beercss-docs] Fetching ${targetUrl}...`);
      const res = await fetch(targetUrl, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        markdown = await res.text();
        fetchedUrl = targetUrl;
      } else {
        console.warn(`[beercss-docs] Tag v${version} returned ${res.status}. Trying main branch...`);
        const fallbackRes = await fetch(fallbackUrl, { signal: AbortSignal.timeout(6000) });
        if (fallbackRes.ok) {
          markdown = await fallbackRes.text();
          fetchedUrl = fallbackUrl;
        }
      }
    } catch (networkErr) {
      console.warn(`[beercss-docs] Network fetch failed (${networkErr.message}). Keeping local copy if present.`);
      return;
    }

    if (!markdown) {
      console.warn('[beercss-docs] Could not retrieve Beer CSS llms.md. Aborting update.');
      return;
    }

    // 3. Prepare target directory
    const outputDir = path.join(rootDir, '.agents', 'rules', 'references');
    fs.mkdirSync(outputDir, { recursive: true });

    // 4. Write reference file with metadata header
    const header = [
      '---',
      `beercss_version: "${version}"`,
      `source: "${fetchedUrl}"`,
      `last_synced: "${new Date().toISOString()}"`,
      '---',
      '',
      `> [!NOTE]`,
      `> This reference is automatically bound to **Beer CSS v${version}**.`,
      `> Auto-updated via \`pnpm update:beercss-docs\` or during package updates.`,
      '',
      '',
    ].join('\n');

    const outputPath = path.join(outputDir, 'beercss.md');
    fs.writeFileSync(outputPath, header + markdown, 'utf8');
    console.log(`[beercss-docs] Successfully updated ${outputPath} (Beer CSS v${version})`);

    // 5. Update version badge in .agents/rules/ui.md if necessary
    const uiRulesPath = path.join(rootDir, '.agents', 'rules', 'ui.md');
    if (fs.existsSync(uiRulesPath)) {
      let uiContent = fs.readFileSync(uiRulesPath, 'utf8');
      const versionRegex = /<!-- BEERCSS_VERSION -->.*?<!-- \/BEERCSS_VERSION -->/s;
      const newVersionBlock = `<!-- BEERCSS_VERSION -->\n**Current Version**: \`v${version}\` ([Full LLM Reference](./references/beercss.md))\n<!-- /BEERCSS_VERSION -->`;
      if (versionRegex.test(uiContent)) {
        uiContent = uiContent.replace(versionRegex, newVersionBlock);
        fs.writeFileSync(uiRulesPath, uiContent, 'utf8');
      }
    }
  } catch (err) {
    console.warn(`[beercss-docs] Non-blocking update error: ${err.message}`);
  }
}

updateBeerCssDocs();
