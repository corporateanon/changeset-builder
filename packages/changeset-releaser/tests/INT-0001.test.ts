import { createChangeset, createPackages, prepareSandbox } from './testUtils';
import { getMonorepoData } from '../src/core';
import yaml from 'yaml-template';
import { IPackageJson } from 'package-json-type';

function createMonorepo() {
  const packages: IPackageJson[] = [
    {
      name: 'app1',
      version: '0.0.1',
      dependencies: {
        'shared-lib': '0.0.1',
        lib1: '0.0.1',
        'app1-data': '0.0.1'
      },
      scripts: {
        build: 'x',
        test: 'y'
      }
    },
    {
      name: 'app1-data',
      version: '0.0.1',
      dependencies: {},
      scripts: {
        build: 'x',
        test: 'y'
      }
    },
    {
      name: 'app2',
      version: '0.0.1',
      dependencies: {
        'shared-lib': '0.0.1'
      },
      scripts: {
        build: 'x',
        test: 'y'
      }
    },
    {
      name: 'lib1',
      version: '0.0.1',
      dependencies: {
        'shared-lib': '0.0.1'
      },
      scripts: {
        build: 'x',
        test: 'y'
      }
    },
    {
      name: 'shared-lib',
      version: '0.0.1',
      dependencies: {
        'external-lib': '0.0.1'
      },
      scripts: {
        build: 'x',
        test: 'y'
      }
    }
  ];

  return packages;
}

describe('INT-0001', () => {
  it('gets data of initial monorepo', async () => {
    const { root } = await prepareSandbox();
    const packages = createMonorepo();
    await createPackages(packages);
    const monorepoData = await getMonorepoData(root);
    expect(monorepoData).toMatchInlineSnapshot(`
      Object {
        "changedPackages": Array [],
        "packageScripts": Object {
          "app1": Set {
            "build",
            "test",
          },
          "app1-data": Set {
            "build",
            "test",
          },
          "app2": Set {
            "build",
            "test",
          },
          "lib1": Set {
            "build",
            "test",
          },
          "shared-lib": Set {
            "build",
            "test",
          },
        },
        "packagesToBuild": Array [],
        "packagesToTest": Array [],
      }
    `);
  });

  it('gets data of monorepo containing changesets', async () => {
    const { root } = await prepareSandbox();
    const packages = createMonorepo();
    await createPackages(packages);
    await createChangeset({ lib1: 'patch' });
    const monorepoData1 = await getMonorepoData(root);
    expect(monorepoData1).toMatchInlineSnapshot(`
      Object {
        "changedPackages": Array [
          "lib1",
        ],
        "packageScripts": Object {
          "app1": Set {
            "build",
            "test",
          },
          "app1-data": Set {
            "build",
            "test",
          },
          "app2": Set {
            "build",
            "test",
          },
          "lib1": Set {
            "build",
            "test",
          },
          "shared-lib": Set {
            "build",
            "test",
          },
        },
        "packagesToBuild": Array [
          "shared-lib",
          "lib1",
          "app1-data",
          "app1",
        ],
        "packagesToTest": Array [
          "lib1",
          "app1",
        ],
      }
    `);
  });
});
