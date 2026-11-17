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
const repoRoot = path.resolve(mobileDir, '..');
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

  const withoutMgmt = pomXml.replace(/<dependencyManagement>[\s\S]*?<\/dependencyManagement>/g, '');
  const depsSection = /<dependencies>([\s\S]*?)<\/dependencies>/.exec(withoutMgmt);
  if (!depsSection) return { packaging, deps };

  const depRegex = /<dependency>([\s\S]*?)<\/dependency>/g;
  let match;
  while ((match = depRegex.exec(depsSection[1])) !== null) {
    const block = match[1].replace(/<exclusions>[\s\S]*?<\/exclusions>/g, '');
    const g = /<groupId>([^<]+)<\/groupId>/.exec(block)?.[1]?.trim();
    const a = /<artifactId>([^<]+)<\/artifactId>/.exec(block)?.[1]?.trim();
    const v = /<version>([^<]+)<\/version>/.exec(block)?.[1]?.trim();
    const scope = /<scope>([^<]+)<\/scope>/.exec(block)?.[1]?.trim() || 'compile';
    const optional = /<optional>([^<]+)<\/optional>/.exec(block)?.[1]?.trim() === 'true';
    const type = /<type>([^<]+)<\/type>/.exec(block)?.[1]?.trim();
    if (!g || !a || !v || v.includes('${') || optional) continue;
    if (scope !== 'compile' && scope !== 'runtime') continue;
    deps.push({ groupId: g, artifactId: a, version: cleanVersionRange(v), type });
  }
  return { packaging, deps };
}

async function resolveTransitiveArtifacts() {
  fs.mkdirSync(depsDir, { recursive: true });
  const visited = new Map(); // groupId:artifactId -> { version, file }
  const queue = ROOT_COORDS.map((c) => {
    const [groupId, artifactId, version] = c.split(':');
    return { groupId, artifactId, version };
  });

  while (queue.length > 0) {
    const cur = queue.shift();
    const key = `${cur.groupId}:${cur.artifactId}`;
    if (IGNORED_ARTIFACTS.has(key) || visited.has(key)) continue;

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
        const destPath = path.join(depsDir, `${cur.artifactId}-${cur.version}.${ext}`);
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(artPath, destPath);
        }
        visited.set(key, { version: cur.version, file: destPath });
      }
    } else {
      visited.set(key, { version: cur.version, file: null });
    }

    for (const d of deps) {
      if (!visited.has(`${d.groupId}:${d.artifactId}`)) {
        queue.push(d);
      }
    }
  }
}

function extractAarArchives() {
  fs.mkdirSync(unpackedDir, { recursive: true });
  const jars = [];
  const aarResDirs = [];

  if (!fs.existsSync(depsDir)) return { jars, aarResDirs };

  for (const file of fs.readdirSync(depsDir)) {
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
      const resDir = path.join(out, 'res');
      if (fs.existsSync(resDir) && fs.readdirSync(resDir).length > 0) {
        aarResDirs.push({ name, resDir });
      }
    }
  }
  return { jars, aarResDirs };
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
    throw new Error(`Android platform jar not found at ${platformJar}`);
  }

  const aapt2 = path.join(buildToolsDir, exe('aapt2'));
  const d8 = path.join(buildToolsDir, bat('d8'));
  const zipalign = path.join(buildToolsDir, exe('zipalign'));
  const apksigner = path.join(buildToolsDir, bat('apksigner'));

  console.log(`[Maven-Android] Using SDK: ${sdkDir}`);
  console.log(`[Maven-Android] Using build-tools: ${buildToolsDir}`);

  fs.mkdirSync(compiledResDir, { recursive: true });
  fs.mkdirSync(genJavaDir, { recursive: true });
  fs.mkdirSync(classesDir, { recursive: true });
  fs.mkdirSync(dexDir, { recursive: true });

  const { jars, aarResDirs } = extractAarArchives();

  const capacitorAndroidDir = path.join(findPackageInNodeModules('@capacitor/android'), 'capacitor', 'src', 'main');
  const capacitorPlugins = [
    '@capacitor/app',
    '@capacitor/haptics',
    '@capacitor/preferences',
    '@capacitor/splash-screen',
    '@capacitor/status-bar',
  ].map((pkg) => path.join(findPackageInNodeModules(pkg), 'android', 'src', 'main'));

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
  let resolvedManifest = rawManifest.replace(/\$\{applicationId\}/g, 'com.sgsk.wealth.mobile');
  if (!/\bpackage=/.test(resolvedManifest)) {
    resolvedManifest = resolvedManifest.replace(
      /<manifest\b/,
      '<manifest package="com.sgsk.wealth.mobile" android:versionCode="1" android:versionName="1.0"'
    );
  }
  const manifestPath = path.join(targetDir, 'AndroidManifest.xml');
  fs.writeFileSync(manifestPath, resolvedManifest, 'utf8');

  const unalignedApk = path.join(targetDir, 'sgsk-wealth-unaligned.apk');
  const linkArgs = [
    'link',
    '--auto-add-overlay',
    '-I', platformJar,
    '--manifest', manifestPath,
    '--min-sdk-version', opts.minSdk,
    '--target-sdk-version', opts.targetSdk,
    '--java', genJavaDir,
    '-A', path.join(appMainDir, 'assets'),
    '-o', unalignedApk,
    '--extra-packages',
    [
      'com.getcapacitor',
      'com.getcapacitor.android',
      'com.capacitorjs.plugins.splashscreen',
      'androidx.appcompat',
      'androidx.appcompat.resources',
      'androidx.core',
      'androidx.core.splashscreen',
      'androidx.coordinatorlayout',
      'androidx.fragment',
      'androidx.activity',
      'androidx.webkit',
    ].join(':'),
    ...flatZipPaths,
  ];
  run(aapt2, linkArgs);

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
