import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mode = process.argv[2] || 'all';
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const has = (file, text) => fs.existsSync(path.join(root, file)) && read(file).includes(text);

if (mode === 'f14' || mode === 'all') {
  if (!has('src/components/common/BrandLogo.tsx', 'aria-label="Alpha Digital"')) failures.push('F14 BrandLogo');
  if (!has('src/components/auth/LoginScreen.tsx', 'BrandLogo')) failures.push('F14 Login BrandLogo');
  if (read('src/components/auth/Unauthorized403Screen.tsx').includes('Estamos trabajando')) failures.push('F14 copy provisional');
  if (!read('src/components/auth/AuthStatusScreens.tsx').includes('Renovación de permisos requerida')) failures.push('F14 copy auth');
  if (read('src/components/dashboard/MetricKpiCards.tsx').includes('animate-ping')) failures.push('F14 animate-ping');
  if (!read('src/components/UIStateFeedback.tsx').includes('top-20 right-3')) failures.push('F14 toast position');
  if (read('src/components/services/ServiceRowMenu.tsx').includes('onMouseLeave')) failures.push('F14 menu mouseleave');
}

if (mode === 'f151' || mode === 'all') {
  if (!has('src/hooks/optimisticServiceUpdates.ts', 'applyOptimisticVisitSchedule')) failures.push('F15.1 module');
  if (read('src/hooks/useServiceWorkflowActions.ts').includes('overlayMessage:')) failures.push('F15.1 blocking overlay');
  if (!has('tests/optimisticUpdates.test.ts', 'rollback')) failures.push('F15.1 tests');
}

if (mode === 'f152' || mode === 'all') {
  if (!has('src/components/common/ConfirmActionModal.tsx', 'ConfirmActionModal')) failures.push('F15.2 confirm');
  if (!has('src/components/common/GlobalQuickSearchModal.tsx', 'ArrowDown')) failures.push('F15.2 search');
  if (!read('src/App.tsx').includes("event.key.toLowerCase() === 'k'")) failures.push('F15.2 shortcut');
}

if (mode === 'f16' || mode === 'all') {
  if (!has('api/index.ts', 'export default app')) failures.push('F16 api');
  if (!has('vercel.json', '"maxDuration": 30')) failures.push('F16 vercel');
  if (!has('drizzle/rls_hardening.sql', 'ENABLE ROW LEVEL SECURITY')) failures.push('F16 RLS');
  const pkg = JSON.parse(read('package.json'));
  if (!pkg.dependencies['puppeteer-core'] || !pkg.dependencies['@sparticuz/chromium']) failures.push('F16 dependencies');
}

if (mode === 'quality' || mode === 'all') {
  const roots = ['src', 'api', 'scripts'];
  const files = [];
  for (const rootName of roots) {
    const absolute = path.join(root, rootName);
    if (!fs.existsSync(absolute)) continue;
    const pending = [absolute];
    while (pending.length) {
      const dir = pending.pop();
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) pending.push(full);
        else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
      }
    }
  }
  if (fs.existsSync(path.join(root, 'server.ts'))) files.push(path.join(root, 'server.ts'));
  for (const file of files) {
    const count = fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
    if (count > 250) failures.push(`250 line limit: ${path.relative(root, file)}=${count}`);
  }
  if (read('docs/tecnica/04_DESPLIEGUE_VERCEL_SUPABASE.md').length < 100) failures.push('documentation');
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log(`MASTER CHECK ${mode} PASSED`);
