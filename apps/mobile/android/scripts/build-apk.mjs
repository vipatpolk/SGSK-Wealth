#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const androidDir = path.resolve(__dirname, '..');
const mobileDir = path.resolve(androidDir, '..');
const repoRoot = path.resolve(mobileDir, '..', '..');
const targetDir = path.join(androidDir, 'target');
const depsDir = path.join(targetDir, 'deps');
const unpackedDir = path.join(targetDir, 'unpacked');
const compiledResDir = path.join(targetDir, 'compiled-res');
const genJavaDir = path.join(targetDir, 'generated-sources');
const classesDir = path.join(targetDir, 'classes');
const dexDir = path.join(targetDir, 'dex');
const m2Repo = path.join(os.homedir(), '.m2', 'repository');

const isWin = process.platform === 'win32';
const exe = (name) => (isWin ? `${name}.exe` : name);
const bat = (name) => (isWin ? `${name}.bat` : name);

const ROOT_COORDS = [
  'androidx.appcompat:appcompat:1.7.0',
  'androidx.browser:browser:1.9.0',
  'androidx.core:core:1.17.0',
  'androidx.activity:activity:1.11.0',
  'androidx.fragment:fragment:1.8.9',
  'androidx.coordinatorlayout:coordinatorlayout:1.3.0',
  'androidx.webkit:webkit:1.14.0',
  'androidx.core:core-splashscreen:1.2.0',
  'org.apache.cordova:framework:14.0.1',
  'org.jetbrains.kotlin:kotlin-stdlib:2.0.21',
];

const IGNORED_ARTIFACTS = new Set([
  'org.jetbrains.kotlin:kotlin-stdlib-jdk7',
  'org.jetbrains.kotlin:kotlin-stdlib-jdk8',
]);

const REPO_URLS = [
  'https://dl.google.com/dl/android/maven2',
  'https://repo1.maven.org/maven2',
];

function parseArgs() {
  const opts = { compileSdk: '36', minSdk: '24', targetSdk: '36', buildType: 'debug', resolveOnly: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--resolve-only') {
      opts.resolveOnly = true;
      continue;
    }
    const m = /^--([^=]+)=(.+)$/.exec(arg);
    if (m) opts[m[1]] = m[2];
  }
  return opts;
}

function findAndroidSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk'),
    path.join(process.env.HOME || '', 'Android', 'Sdk'),
    '/usr/local/lib/android/sdk',
  ].filter(Boolean);
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  throw new Error('Android SDK not found. Set ANDROID_HOME or ANDROID_SDK_ROOT.');
}

function findLatestBuildTools(sdkDir) {
  const btRoot = path.join(sdkDir, 'build-tools');
  if (!fs.existsSync(btRoot)) {
    throw new Error(`Android build-tools directory missing at ${btRoot}`);
  }
  const versions = fs
    .readdirSync(btRoot)
    .filter((v) => fs.statSync(path.join(btRoot, v)).isDirectory())
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  if (versions.length === 0) {
    throw new Error(`No Android build-tools versions installed in ${btRoot}`);
  }
  return path.join(btRoot, versions[0]);
}

function walkFiles(dir, extFilter, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, extFilter, out);
    } else if (!extFilter || extFilter(full)) {
      out.push(full);
    }
  }
  return out;
}

function run(cmd, args, opts = {}) {
  execFileSync(cmd, args, { stdio: 'inherit', ...opts });
}

function findPackageInNodeModules(pkgName) {
  const candidates = [
    path.join(mobileDir, 'node_modules', ...pkgName.split('/')),
    path.join(repoRoot, 'node_modules', ...pkgName.split('/')),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(`Unable to locate npm package ${pkgName}`);
}

async function fetchToLocalM2(relPath) {
  const localPath = path.join(m2Repo, relPath);
  if (fs.existsSync(localPath)) return localPath;

  for (const base of REPO_URLS) {
    const url = `${base}/${relPath.replace(/\\/g, '/')}`;
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const buf = Buffer.from(await resp.arrayBuffer());
        fs.mkdirSync(path.dirname(localPath), { recursive: true });
        fs.writeFileSync(localPath, buf);
        return localPath;
      }
    } catch {
      // Try next repository
    }
  }
  return null;
}

function cleanVersionRange(v) {
  const m = /^\[([^,\]]+)/.exec(v.trim());
  return m ? m[1] : v.trim();
}

function parsePomDependencies(pomXml) {
  const pkgMatch = /<packaging>([^<]+)<\/packaging>/.exec(pomXml);
  const packaging = pkgMatch ? pkgMatch[1].trim() : 'jar';
  const deps = [];

  const mgmtVersions = new Map();
  const mgmtSection = /<dependencyManagement>([\s\S]*?)<\/dependencyManagement>/.exec(pomXml);
  if (mgmtSection) {
    const mgmtDepRegex = /<dependency>([\s\S]*?)<\/dependency>/g;
    let mgmtMatch;
    while ((mgmtMatch = mgmtDepRegex.exec(mgmtSection[1])) !== null) {
      const block = mgmtMatch[1];
      const g = /<groupId>([^<]+)<\/groupId>/.exec(block)?.[1]?.trim();
      const a = /<artifactId>([^<]+)<\/artifactId>/.exec(block)?.[1]?.trim();
      const v = /<version>([^<]+)<\/version>/.exec(block)?.[1]?.trim();
      if (g && a && v && !v.includes('${')) {
        mgmtVersions.set(`${g}:${a}`, cleanVersionRange(v));
      }
    }
  }

  const withoutMgmt = pomXml.replace(/<dependencyManagement>[\s\S]*?<\/dependencyManagement>/g, '');
  const depsSection = /<dependencies>([\s\S]*?)<\/dependencies>/.exec(withoutMgmt);
  if (!depsSection) return { packaging, deps };

  const depRegex = /<dependency>([\s\S]*?)<\/dependency>/g;
  let match;
  while ((match = depRegex.exec(depsSection[1])) !== null) {
    const block = match[1].replace(/<exclusions>[\s\S]*?<\/exclusions>/g, '');
    const g = /<groupId>([^<]+)<\/groupId>/.exec(block)?.[1]?.trim();
    const a = /<artifactId>([^<]+)<\/artifactId>/.exec(block)?.[1]?.trim();
    let v = /<version>([^<]+)<\/version>/.exec(block)?.[1]?.trim();
    const scope = /<scope>([^<]+)<\/scope>/.exec(block)?.[1]?.trim() || 'compile';
    const optional = /<optional>([^<]+)<\/optional>/.exec(block)?.[1]?.trim() === 'true';
    const type = /<type>([^<]+)<\/type>/.exec(block)?.[1]?.trim();
    if (!g || !a || optional) continue;
    if (scope !== 'compile' && scope !== 'runtime') continue;
    if (!v) {
      v = mgmtVersions.get(`${g}:${a}`);
    }
    if (!v || v.includes('${')) continue;
    deps.push({ groupId: g, artifactId: a, version: cleanVersionRange(v), type });
  }
  return { packaging, deps };
}

function compareVersions(a, b) {
  const pa = a.split(/[.-]/).map((s) => (/^\d+$/.test(s) ? Number(s) : s));
  const pb = b.split(/[.-]/).map((s) => (/^\d+$/.test(s) ? Number(s) : s));
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (typeof va === 'number' && typeof vb === 'number') {
      if (va !== vb) return va - vb;
    } else {
      const sa = String(va);
      const sb = String(vb);
      if (sa !== sb) return sa.localeCompare(sb);
    }
  }
  return 0;
}

async function resolveTransitiveArtifacts() {
  fs.mkdirSync(depsDir, { recursive: true });
  const resolved = new Map(); // groupId:artifactId -> { version, file, ext }
  const queue = ROOT_COORDS.map((c) => {
    const [groupId, artifactId, version] = c.split(':');
    return { groupId, artifactId, version };
  });

  while (queue.length > 0) {
    const cur = queue.shift();
    const key = `${cur.groupId}:${cur.artifactId}`;
    if (IGNORED_ARTIFACTS.has(key)) continue;

    const existing = resolved.get(key);
    if (existing && compareVersions(existing.version, cur.version) >= 0) continue;

    const groupPath = cur.groupId.replace(/\./g, '/');
    const pomRel = `${groupPath}/${cur.artifactId}/${cur.version}/${cur.artifactId}-${cur.version}.pom`;
    const pomPath = await fetchToLocalM2(pomRel);
    if (!pomPath) continue;

    const pomXml = fs.readFileSync(pomPath, 'utf8');
    const { packaging, deps } = parsePomDependencies(pomXml);
    const ext = packaging === 'aar' ? 'aar' : packaging === 'pom' ? null : 'jar';

    if (ext) {
      const artRel = `${groupPath}/${cur.artifactId}/${cur.version}/${cur.artifactId}-${cur.version}.${ext}`;
      const artPath = await fetchToLocalM2(artRel);
      if (artPath) {
        if (existing?.file && fs.existsSync(existing.file)) {
          fs.rmSync(existing.file, { force: true });
        }
        const destPath = path.join(depsDir, `${cur.artifactId}-${cur.version}.${ext}`);
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(artPath, destPath);
        }
        resolved.set(key, { version: cur.version, file: destPath, ext });
      }
    } else {
      resolved.set(key, { version: cur.version, file: null, ext: null });
    }

    for (const d of deps) {
      const depKey = `${d.groupId}:${d.artifactId}`;
      const depExisting = resolved.get(depKey);
      if (!depExisting || compareVersions(depExisting.version, d.version) < 0) {
        queue.push(d);
      }
    }
  }

  // Remove any stale artifact files in depsDir not matching the winning version
  const winningFiles = new Set(
    [...resolved.values()].map((r) => r.file).filter(Boolean).map((f) => path.basename(f))
  );
  for (const file of fs.readdirSync(depsDir)) {
    if (!winningFiles.has(file)) {
      fs.rmSync(path.join(depsDir, file), { force: true });
    }
  }
}

function extractAarArchives() {
  fs.rmSync(unpackedDir, { recursive: true, force: true });
  fs.mkdirSync(unpackedDir, { recursive: true });
  const jars = [];
  const aarResDirs = [];
  const aarManifests = [];
  const aarRPackages = new Set();

  if (!fs.existsSync(depsDir)) {
    return { jars, aarResDirs, aarManifests, aarRPackages };
  }

  for (const file of fs.readdirSync(depsDir).sort()) {
    const full = path.join(depsDir, file);
    if (file.endsWith('.jar')) {
      jars.push(full);
    } else if (file.endsWith('.aar')) {
      const name = file.slice(0, -4);
      const out = path.join(unpackedDir, name);
      fs.mkdirSync(out, { recursive: true });
      run('jar', ['xf', full], { cwd: out });

      const classesJar = path.join(out, 'classes.jar');
      if (fs.existsSync(classesJar)) {
        const renamedJar = path.join(out, `${name}.jar`);
        fs.copyFileSync(classesJar, renamedJar);
        jars.push(renamedJar);
      }

      const libsDir = path.join(out, 'libs');
      if (fs.existsSync(libsDir)) {
        for (const libFile of fs.readdirSync(libsDir).sort()) {
          if (libFile.endsWith('.jar')) {
            const renamedLib = path.join(out, `${name}-${libFile}`);
            fs.copyFileSync(path.join(libsDir, libFile), renamedLib);
            jars.push(renamedLib);
          }
        }
      }

      const resDir = path.join(out, 'res');
      const hasRes = fs.existsSync(resDir) && fs.readdirSync(resDir).length > 0;
      if (hasRes) {
        aarResDirs.push({ name, resDir });
      }

      const rTxtPath = path.join(out, 'R.txt');
      const hasRTxt = fs.existsSync(rTxtPath) && fs.readFileSync(rTxtPath, 'utf8').trim().length > 0;

      const manifestFile = path.join(out, 'AndroidManifest.xml');
      if (fs.existsSync(manifestFile)) {
        const manifestXml = fs.readFileSync(manifestFile, 'utf8');
        const pkgMatch = /\bpackage="([^"]+)"/.exec(manifestXml);
        aarManifests.push({ name, pkg: pkgMatch ? pkgMatch[1] : null, xml: manifestXml });
        if (pkgMatch && (hasRes || hasRTxt)) {
          aarRPackages.add(pkgMatch[1]);
        }
      }
    }
  }
  return { jars, aarResDirs, aarManifests, aarRPackages };
}

function getAttr(tagStr, attrName) {
  const m = new RegExp(`\\b${attrName}="([^"]+)"`).exec(tagStr);
  return m ? m[1] : null;
}

function stripToolsAttrs(xml) {
  return xml.replace(/\s+tools:[A-Za-z0-9_.-]+="[^"]*"/g, '');
}

function mergeAndroidManifests(appManifestXml, libraryManifests, appId) {
  const replaceAppId = (s) => s.replace(/\$\{applicationId\}/g, appId);
  let merged = replaceAppId(appManifestXml);

  if (!/\bpackage=/.test(merged)) {
    merged = merged.replace(
      /<manifest\b/,
      `<manifest package="${appId}" android:versionCode="1" android:versionName="1.0"`
    );
  }

  const seenTopTags = new Set();
  const seenComponents = new Set();
  const seenQueries = new Set();
  const extraTopBlocks = [];
  const extraAppBlocks = [];
  const extraQueryBlocks = [];
  const startupMetaData = new Map();
  let startupProviderOpenTag = null;
  let appComponentFactory = null;

  const qualifyRelativeNames = (block, pkg) => {
    if (!pkg) return block;
    return block.replace(/\bandroid:name="(\.[^"]+)"/g, `android:name="${pkg}$1"`);
  };

  const trackExisting = (xml) => {
    for (const m of xml.matchAll(/<(permission|uses-permission|uses-feature)\b[^>]*>/g)) {
      const name = getAttr(m[0], 'android:name');
      if (name) seenTopTags.add(`${m[1]}:${name}`);
    }
    for (const m of xml.matchAll(/<(provider|receiver|service|activity)\b[^>]*>/g)) {
      const name = getAttr(m[0], 'android:name');
      if (name) seenComponents.add(`${m[1]}:${name}`);
    }
    for (const qm of xml.matchAll(/<queries\b[^>]*>([\s\S]*?)<\/queries>/g)) {
      const inner = stripToolsAttrs(qm[1]).trim();
      if (inner) seenQueries.add(inner.replace(/\s+/g, ' '));
    }
  };
  trackExisting(merged);

  for (const lib of libraryManifests) {
    const xml = replaceAppId(lib.xml);
    const xmlPkgMatch = /\bpackage="([^"]+)"/.exec(xml);
    const libPkg = lib.pkg || (xmlPkgMatch ? xmlPkgMatch[1] : null);

    // Capture application-level android:appComponentFactory
    const appOpenMatch = /<application\b([^>]*)>/.exec(xml);
    if (appOpenMatch && !appComponentFactory) {
      const factory = getAttr(appOpenMatch[1], 'android:appComponentFactory');
      if (factory) appComponentFactory = factory;
    }

    // Top-level permissions & features
    for (const m of xml.matchAll(/<(permission|uses-permission|uses-feature)\b[^>]*\/?>/g)) {
      const tag = m[1];
      const name = getAttr(m[0], 'android:name');
      if (!name) continue;
      const key = `${tag}:${name}`;
      if (!seenTopTags.has(key)) {
        seenTopTags.add(key);
        const selfClosing = m[0].endsWith('/>') ? m[0] : `${m[0]}</${tag}>`;
        extraTopBlocks.push(stripToolsAttrs(selfClosing));
      }
    }

    // Top-level <queries> blocks (required for Android 11+ Chrome Custom Tabs / Browser plugin)
    for (const qm of xml.matchAll(/<queries\b[^>]*>([\s\S]*?)<\/queries>/g)) {
      const inner = stripToolsAttrs(qm[1]).trim();
      if (!inner) continue;
      const normKey = inner.replace(/\s+/g, ' ');
      if (!seenQueries.has(normKey)) {
        seenQueries.add(normKey);
        extraQueryBlocks.push(inner);
      }
    }

    // Extract <application> inner components (<provider>, <receiver>, <service>, <activity>)
    const appBodyMatch = /<application\b[^>]*>([\s\S]*?)<\/application>/.exec(xml);
    if (!appBodyMatch) continue;
    const appBody = appBodyMatch[1];

    for (const tag of ['provider', 'receiver', 'service', 'activity']) {
      const regex = new RegExp(`<${tag}\\b([\\s\\S]*?)(?:/>|>[\\s\\S]*?</${tag}>)`, 'g');
      for (const m of appBody.matchAll(regex)) {
        const block = qualifyRelativeNames(m[0], libPkg);
        const compName = getAttr(block, 'android:name');
        if (!compName) continue;

        if (tag === 'provider' && compName === 'androidx.startup.InitializationProvider') {
          if (!startupProviderOpenTag) {
            const openMatch = /<provider\b([^>]*?)(\/?)>/.exec(block);
            if (openMatch) {
              startupProviderOpenTag = stripToolsAttrs(`<provider${openMatch[1]}>`);
            }
          }
          for (const md of block.matchAll(/<meta-data\b[^>]*\/?>/g)) {
            const mdName = getAttr(md[0], 'android:name');
            if (mdName && !startupMetaData.has(mdName)) {
              const mdTag = md[0].endsWith('/>') ? md[0] : `${md[0]}</meta-data>`;
              startupMetaData.set(mdName, stripToolsAttrs(mdTag));
            }
          }
          continue;
        }

        const key = `${tag}:${compName}`;
        if (!seenComponents.has(key)) {
          seenComponents.add(key);
          extraAppBlocks.push(stripToolsAttrs(block));
        }
      }
    }
  }

  if (startupProviderOpenTag && !seenComponents.has('provider:androidx.startup.InitializationProvider')) {
    const metaLines = [...startupMetaData.values()].map((m) => `            ${m}`).join('\n');
    const providerBlock = metaLines
      ? `${startupProviderOpenTag}\n${metaLines}\n        </provider>`
      : `${startupProviderOpenTag}</provider>`;
    extraAppBlocks.push(providerBlock);
  }

  if (appComponentFactory && !/\bandroid:appComponentFactory=/.test(merged)) {
    merged = merged.replace(
      /<application\b/,
      `<application\n        android:appComponentFactory="${appComponentFactory}"`
    );
  }

  if (extraAppBlocks.length > 0) {
    merged = merged.replace(
      /<\/application>/,
      `    ${extraAppBlocks.join('\n\n        ')}\n    </application>`
    );
  }

  if (extraTopBlocks.length > 0) {
    merged = merged.replace(
      /<\/manifest>/,
      `\n    ${extraTopBlocks.join('\n    ')}\n</manifest>`
    );
  }

  if (extraQueryBlocks.length > 0) {
    if (/<\/queries>/.test(merged)) {
      merged = merged.replace(
        /<\/queries>/,
        `        ${extraQueryBlocks.join('\n        ')}\n    </queries>`
      );
    } else {
      merged = merged.replace(
        /<\/manifest>/,
        `\n    <queries>\n        ${extraQueryBlocks.join('\n        ')}\n    </queries>\n</manifest>`
      );
    }
  }

  return merged;
}

async function main() {
  const opts = parseArgs();
  await resolveTransitiveArtifacts();
  if (opts.resolveOnly) {
    const { jars, aarResDirs } = extractAarArchives();
    console.log(`[Maven-Android] Resolved ${jars.length} jars and ${aarResDirs.length} AAR resource dirs.`);
    return;
  }

  const sdkDir = findAndroidSdk();
  const buildToolsDir = findLatestBuildTools(sdkDir);
  const platformJar = path.join(sdkDir, 'platforms', `android-${opts.compileSdk}`, 'android.jar');
  if (!fs.existsSync(platformJar)) {
    const platformsDir = path.join(sdkDir, 'platforms');
    const available = fs.existsSync(platformsDir) ? fs.readdirSync(platformsDir).join(', ') : 'none';
    throw new Error(`Android platform jar not found at ${platformJar} (installed platforms: ${available})`);
  }

  const aapt2 = path.join(buildToolsDir, exe('aapt2'));
  const d8 = path.join(buildToolsDir, bat('d8'));
  const zipalign = path.join(buildToolsDir, exe('zipalign'));
  const apksigner = path.join(buildToolsDir, bat('apksigner'));

  console.log(`[Maven-Android] Using SDK: ${sdkDir}`);
  console.log(`[Maven-Android] Using build-tools: ${buildToolsDir}`);

  for (const dir of [compiledResDir, genJavaDir, classesDir, dexDir]) {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
  }

  const { jars, aarResDirs, aarManifests, aarRPackages } = extractAarArchives();

  const capacitorAndroidRoot = path.join(findPackageInNodeModules('@capacitor/android'), 'capacitor');
  const capacitorAndroidDir = path.join(capacitorAndroidRoot, 'src', 'main');
  const capacitorPluginRoots = [
    '@capacitor/app',
    '@capacitor/browser',
    '@capacitor/haptics',
    '@capacitor/preferences',
    '@capacitor/splash-screen',
    '@capacitor/status-bar',
  ].map((pkg) => ({
    pkg,
    androidRoot: path.join(findPackageInNodeModules(pkg), 'android'),
    mainDir: path.join(findPackageInNodeModules(pkg), 'android', 'src', 'main'),
  }));
  const capacitorPlugins = capacitorPluginRoots.map((p) => p.mainDir);

  const libraryManifests = [...aarManifests];
  const capManifestPath = path.join(capacitorAndroidDir, 'AndroidManifest.xml');
  if (fs.existsSync(capManifestPath)) {
    const capXml = fs.readFileSync(capManifestPath, 'utf8');
    const capPkgMatch = /\bpackage="([^"]+)"/.exec(capXml);
    libraryManifests.push({
      name: '@capacitor/android',
      pkg: capPkgMatch ? capPkgMatch[1] : 'com.getcapacitor.android',
      xml: capXml,
    });
  }

  const extraPackages = new Set([
    'com.getcapacitor',
    'com.getcapacitor.android',
    'org.apache.cordova',
    ...aarRPackages,
  ]);

  for (const plugin of capacitorPluginRoots) {
    let pluginPkg = null;
    const gradlePath = path.join(plugin.androidRoot, 'build.gradle');
    if (fs.existsSync(gradlePath)) {
      const gradleTxt = fs.readFileSync(gradlePath, 'utf8');
      const nsMatch = /\bnamespace\s*=?\s*["']([^"']+)["']/.exec(gradleTxt);
      if (nsMatch) {
        pluginPkg = nsMatch[1];
        extraPackages.add(nsMatch[1]);
      }
    }
    const manifestPath = path.join(plugin.mainDir, 'AndroidManifest.xml');
    if (fs.existsSync(manifestPath)) {
      const xml = fs.readFileSync(manifestPath, 'utf8');
      const pkgMatch = /\bpackage="([^"]+)"/.exec(xml);
      if (pkgMatch) {
        pluginPkg = pkgMatch[1];
        extraPackages.add(pkgMatch[1]);
      }
      libraryManifests.push({ name: plugin.pkg, pkg: pluginPkg, xml });
    }
  }

  const appMainDir = path.join(androidDir, 'app', 'src', 'main');
  const resDirs = [
    ...aarResDirs.map((a) => a.resDir),
    path.join(capacitorAndroidDir, 'res'),
    ...capacitorPlugins.map((p) => path.join(p, 'res')),
    path.join(appMainDir, 'res'),
  ].filter((d) => fs.existsSync(d));

  const flatZipPaths = [];
  resDirs.forEach((resDir, idx) => {
    const outZip = path.join(compiledResDir, `res-${idx}.zip`);
    run(aapt2, ['compile', '--dir', resDir, '-o', outZip]);
    flatZipPaths.push(outZip);
  });

  const rawManifest = fs.readFileSync(path.join(appMainDir, 'AndroidManifest.xml'), 'utf8');
  const resolvedManifest = mergeAndroidManifests(rawManifest, libraryManifests, 'com.sgsk.wealth.mobile');
  const manifestPath = path.join(targetDir, 'AndroidManifest.xml');
  fs.writeFileSync(manifestPath, resolvedManifest, 'utf8');

  const unalignedApk = path.join(targetDir, 'sgsk-wealth-unaligned.apk');
  const [baseResZip, ...overlayResZips] = flatZipPaths;
  const overlayArgs = overlayResZips.flatMap((z) => ['-R', z]);
  const linkArgs = [
    'link',
    '--auto-add-overlay',
    ...(opts.buildType === 'debug' ? ['--debug-mode'] : []),
    '-I', platformJar,
    '--manifest', manifestPath,
    '--min-sdk-version', opts.minSdk,
    '--target-sdk-version', opts.targetSdk,
    '--java', genJavaDir,
    '-o', unalignedApk,
    '--extra-packages',
    [...extraPackages].sort().join(':'),
    baseResZip,
    ...overlayArgs,
  ];
  run(aapt2, linkArgs);

  // Stage assets from @capacitor/android, plugins, and app into target/staged-assets/assets
  // and add via `jar uf` so ZIP entry paths always use `/` (aapt2 -A emits `\` on Windows).
  const stagedRoot = path.join(targetDir, 'staged-assets');
  const stagedAssetsDir = path.join(stagedRoot, 'assets');
  fs.rmSync(stagedRoot, { recursive: true, force: true });
  fs.mkdirSync(stagedAssetsDir, { recursive: true });
  const assetDirs = [
    path.join(capacitorAndroidDir, 'assets'),
    ...capacitorPlugins.map((p) => path.join(p, 'assets')),
    path.join(appMainDir, 'assets'),
  ].filter((d) => fs.existsSync(d));
  for (const dir of assetDirs) {
    fs.cpSync(dir, stagedAssetsDir, { recursive: true, force: true });
  }
  for (const reqAsset of [
    path.join(stagedAssetsDir, 'public', 'index.html'),
    path.join(stagedAssetsDir, 'capacitor.config.json'),
    path.join(stagedAssetsDir, 'capacitor.plugins.json'),
  ]) {
    if (!fs.existsSync(reqAsset)) {
      throw new Error(`Missing required Capacitor Android asset: ${reqAsset}. Run "npm run cap:sync" from the workspace root first.`);
    }
  }
  run('jar', ['uf', unalignedApk, '-C', stagedRoot, 'assets']);

  const javaSources = [
    ...walkFiles(genJavaDir, (f) => f.endsWith('.java')),
    ...walkFiles(path.join(capacitorAndroidDir, 'java'), (f) => f.endsWith('.java')),
    ...capacitorPlugins.flatMap((p) => walkFiles(path.join(p, 'java'), (f) => f.endsWith('.java'))),
    ...walkFiles(path.join(appMainDir, 'java'), (f) => f.endsWith('.java')),
  ];

  const sourceListPath = path.join(targetDir, 'sources.txt');
  fs.writeFileSync(sourceListPath, javaSources.map((s) => `"${s.replace(/\\/g, '/')}"`).join('\n'), 'utf8');

  const classpath = [platformJar, ...jars].join(path.delimiter);
  run('javac', [
    '--release', '21',
    '-encoding', 'UTF-8',
    '-cp', classpath,
    '-d', classesDir,
    `@${sourceListPath}`,
  ]);

  const appClassesJar = path.join(targetDir, 'app-classes.jar');
  run('jar', ['cf', appClassesJar, '-C', classesDir, '.']);

  const d8Args = [
    '--min-api', opts.minSdk,
    '--lib', platformJar,
    '--output', dexDir,
    appClassesJar,
    ...jars,
  ];
  run(d8, d8Args, { shell: isWin });

  const dexFiles = fs.readdirSync(dexDir).filter((f) => f.endsWith('.dex'));
  if (dexFiles.length === 0) {
    throw new Error(`No .dex files produced in ${dexDir}`);
  }
  const jarAddArgs = ['uf', unalignedApk];
  for (const dexFile of dexFiles) {
    jarAddArgs.push('-C', dexDir, dexFile);
  }
  run('jar', jarAddArgs);

  const alignedApk = path.join(targetDir, 'sgsk-wealth-aligned.apk');
  run(zipalign, ['-f', '4', unalignedApk, alignedApk]);

  const keystorePath = process.env.ANDROID_KEYSTORE_PATH || path.join(targetDir, 'debug.keystore');
  const keystorePass = process.env.ANDROID_KEYSTORE_PASS || 'android';
  const keyAlias = process.env.ANDROID_KEY_ALIAS || 'androiddebugkey';
  const keyPass = process.env.ANDROID_KEY_PASS || 'android';

  if (!fs.existsSync(keystorePath)) {
    run('keytool', [
      '-genkeypair',
      '-v',
      '-keystore', keystorePath,
      '-storepass', keystorePass,
      '-alias', keyAlias,
      '-keypass', keyPass,
      '-keyalg', 'RSA',
      '-keysize', '2048',
      '-validity', '10000',
      '-dname', 'CN=SGSK Wealth Debug,O=SGSK Wealth,C=TH',
    ]);
  }

  const finalApk = path.join(targetDir, `sgsk-wealth-${opts.buildType}.apk`);
  run(
    apksigner,
    [
      'sign',
      '--ks', keystorePath,
      '--ks-pass', `pass:${keystorePass}`,
      '--ks-key-alias', keyAlias,
      '--key-pass', `pass:${keyPass}`,
      '--out', finalApk,
      alignedApk,
    ],
    { shell: isWin }
  );

  console.log(`[Maven-Android] APK built successfully: ${finalApk}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
