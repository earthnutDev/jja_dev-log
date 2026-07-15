import {
  pathJoin,
  readFileToJsonSync,
  writeJsonFileSync,
  getDirectoryBy,
} from '@vvi/node';

// 原始 package.json 内容
let packageJson = readFileToJsonSync('./package.json');
const dependencies = packageJson.dependencies;
// 移除冗余的键
[
  'scripts',
  'devDependencies',
  'lint-staged',
  'private',
  'dependencies',
  'packageManager',
  'jja',
  'type'
].forEach(key => delete packageJson[key]);
  const esPrefix = 'es'; // es 前缀
const cjsPrefix = 'cjs'; // cjs 前缀
const dtsPrefix = 'es'; // 类型文件的前缀
// 查看当前打包 dist 文件路径
const distParentPath = getDirectoryBy('dist', 'directory');

packageJson = {
  ...packageJson,
  main: cjsPrefix + '/index.js', // 旧版本 CommonJs 入口
  types: dtsPrefix + '/index.d.ts', // 旧版本类型入口
  author: {
    name: '泥豆君',
    email: 'Mr.MudBean@outlook.com',
    url: 'https://mudbean.cn',
  },
  description: '简单的文件读写',
  "sideEffects": false,
  license: 'MIT',
  files: [cjsPrefix, esPrefix ,  'LICENSE', 'README.md','CHANGELOG.md'],
  exports: {
    '.': {
      import: {
        default: `./${esPrefix}/index.js`,
        types: `./${dtsPrefix}/index.d.ts`,
      },
      require: {
        default: `./${cjsPrefix}/index.js`,
        types: `./${dtsPrefix}/index.d.ts`,
      },
    },
  },
  keywords: ['qqi', 'mudbean','vvi'],
  homepage: 'https://npm.lmssee.com/qqi',
  dependencies,
  bugs: {
    url: 'https://github.com/MrMudBean/qqi/issues',
    email: 'Mr.MudBean@outlook.com',
    }, 
  repository: {
    type: 'git',
    url: 'git+https://github.com/MrMudBean/qqi.git',
  },
  publishConfig: {
    access: 'public',
    registry: 'https://registry.npmjs.org/',
  },
  browserslist: ['node>=18.0.0'],
  engines: {
    node: '>=18.0.0',
  },
};

{
  // 整理打包后 package.json 文件路径
  const distPackagePath = pathJoin(distParentPath, './dist/package.json');
  // 写入新的 packages.json 文件
  writeJsonFileSync(distPackagePath, packageJson);
}
