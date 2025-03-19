import { JsonPatch, typescript } from 'projen';
import {
  NodePackageManager,
  Transform,
  UpgradeDependenciesSchedule,
} from 'projen/lib/javascript';
const project = new typescript.TypeScriptProject({
  defaultReleaseBranch: 'main',
  name: 'aws-k8s',
  projenrcTs: true,

  release: true,
  entrypoint: 'src/index.ts',
  releaseToNpm: false,
  githubOptions: {
    mergify: false,
    workflows: true,
    // merge queues are not yet available on public personal repos
    // mergeQueue: true,
    // mergeQueueOptions: {
    //   targetBranches: ['main'],
    // },
  },
  depsUpgradeOptions: {
    workflowOptions: {
      labels: ['auto-approve'],
      schedule: UpgradeDependenciesSchedule.WEEKLY,
    },
  },
  autoApproveOptions: {
    label: 'auto-approve',
    allowedUsernames: ['flostadler'],
  },
  prettier: true,
  prettierOptions: {
    settings: {
      singleQuote: true,
    },
  },
  eslintOptions: {
    dirs: [],
    prettier: true,
  },
  packageManager: NodePackageManager.NPM,

  deps: [
    '@pulumi/pulumi',
    '@pulumi/aws-native',
    '@pulumi/aws',
    '@pulumi/kubernetes',
    '@pulumi/tls'
  ],
  devDeps: ['@swc/core', '@swc/jest', 'camelcase', '@pulumi/awsx'],
  jestOptions: {
    configFilePath: 'jest.config.json',
  },
  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
const eslint = project.tryFindObjectFile('.eslintrc.json');
// I don't want to show linting errors for things that get auto fixed
eslint?.addOverride('extends', ['plugin:import/typescript']);

const jestConfig = project.tryFindObjectFile('jest.config.json');
jestConfig?.patch(JsonPatch.remove('/preset'));
jestConfig?.patch(JsonPatch.remove('/globals'));
jestConfig?.patch(
  JsonPatch.add('/transform', {
    '^.+\\.(t|j)sx?$': new Transform('@swc/jest'),
  }),
);

project.synth();
