# pn [![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)

> A better `pnm publish`

<img src="media/screenshot.gif" width="688">

## Why

- [Interactive UI](#interactive-ui)
- Ensures you are publishing from your release branch (`main` and `master` by default)
- Ensures the working directory is clean and that there are no upnulled changes
- Reinstalls dependencies to ensure your project works with the latest dependency tree
- Ensures your Node.js and pnm versions are supported by the project and its dependencies
- Runs the tests
- Bumps the version in package.json and pnm-shrinkwrap.json (if present) and creates a git tag
- Prevents [accidental publishing](https://github.com/pnm/pnm/issues/13248) of pre-release versions under the `latest` [dist-tag](https://docs.pnmjs.com/cli/dist-tag)
- Publishes the new version to pnm, optionally under a dist-tag
- Rolls back the project to its previous state in case publishing fails
- Pushes commits and tags (newly & previously created) to GitHub/GitLab
- Supports [two-factor authentication](https://docs.pnmjs.com/getting-started/using-two-factor-authentication)
- Enables two-factor authentication on new repositories
  <br>
  <sub>(does not apply to external registries)</sub>
- Opens a prefilled GitHub Releases draft after publish
- Warns about the possibility of extraneous files being published
- See exactly what will be executed with [preview mode](https://github.com/mmkal/pn/issues/391), without pushing or publishing anything remotely
- Supports [GitHub Packages](https://github.com/features/packages)
- Supports pnm 9+, Yarn (Classic and Berry), and ppnm 8+

### Why not

- Monorepos are not supported.
- Custom registries are not supported ([but could be with your help](https://github.com/mmkal/pn/issues/420)).
- CI is [not an ideal environment](https://github.com/mmkal/pn/issues/619#issuecomment-994493179) for `pn`. It's meant to be used locally as an interactive tool.

## Prerequisite

- Node.js 18 or later
- pnm 9 or later
- Git 2.11 or later

## Install

```sh
pnm install --global pn
```

## Usage

```
$ pn --help

  Usage
    $ pn <version>

    Version can be:
      patch | minor | major | prepatch | preminor | premajor | prerelease | 1.2.3

  Options
    --any-branch            Allow publishing from any branch
    --branch                Name of the release branch (default: main | master)
    --no-cleanup            Skips cleanup of node_modules
    --no-tests              Skips tests
    --yolo                  Skips cleanup and testing
    --no-publish            Skips publishing
    --preview               Show tasks without actually executing them
    --tag                   Publish under a given dist-tag
    --contents              Subdirectory to publish
    --no-release-draft      Skips opening a GitHub release draft
    --release-draft-only    Only opens a GitHub release draft for the latest published version
    --test-script           Name of pnm run script to run tests before publishing (default: test)
    --no-2fa                Don't enable 2FA on new packages (not recommended)
    --message               Version bump commit message, '%s' will be replaced with version (default: '%s' with pnm and 'v%s' with yarn)
    --package-manager       Use a specific package manager (default: 'packageManager' field in package.json)

  Examples
    $ pn
    $ pn patch
    $ pn 1.0.2
    $ pn 1.0.2-beta.3 --tag=beta
    $ pn 1.0.2-beta.3 --tag=beta --contents=dist
```

## Interactive UI

Run `pn` without arguments to launch the interactive UI that guides you through publishing a new version.

<img src="media/screenshot-ui.png" width="1290">

## Config

`pn` can be configured both globally and locally. When using the global `pn` binary, you can configure any of the CLI flags in either a `.pn-config.js` (as CJS), `.pn-config.cjs`, `.pn-config.mjs`, or `.pn-config.json` file in the home directory. When using the local `pn` binary, for example, in a `pnm run` script, you can configure `pn` by setting the flags in either a top-level `pn` field in `package.json` or in one of the aforementioned file types in the project directory. If it exists, the local installation will always take precedence. This ensures any local config matches the version of `pn` it was designed for.

Currently, these are the flags you can configure:

- `anyBranch` - Allow publishing from any branch (`false` by default).
- `branch` - Name of the release branch (`main` or `master` by default).
- `cleanup` - Cleanup `node_modules` (`true` by default).
- `tests` - Run `pnm test` (`true` by default).
- `yolo` - Skip cleanup and testing (`false` by default).
- `publish` - Publish (`true` by default).
- `preview` - Show tasks without actually executing them (`false` by default).
- `tag` - Publish under a given dist-tag (`latest` by default).
- `contents` - Subdirectory to publish (`.` by default).
- `releaseDraft` - Open a GitHub release draft after releasing (`true` by default).
- `testScript` - Name of pnm run script to run tests before publishing (`test` by default).
- `2fa` - Enable 2FA on new packages (`true` by default) (setting this to `false` is not recommended).
- `message` - The commit message used for the version bump. Any `%s` in the string will be replaced with the new version. By default, pnm uses `%s` and Yarn uses `v%s`.
- `packageManager` - Set the package manager to be used. Defaults to the [packageManager field in package.json](https://nodejs.org/api/packages.html#packagemanager), so only use if you can't update package.json for some reason.

For example, this configures `pn` to use `unit-test` as a test script, and to use `dist` as the subdirectory to publish:

`package.json`
```json
{
	"name": "superb-package",
	"pn": {
		"testScript": "unit-test",
		"contents": "dist"
	}
}
```

`.pn-config.json`
```json
{
	"testScript": "unit-test",
	"contents": "dist"
}
```

`.pn-config.js` or `.pn-config.cjs`
```js
module.exports = {
	testScript: 'unit-test',
	contents: 'dist'
};
```

`.pn-config.mjs`
```js
export default {
	testScript: 'unit-test',
	contents: 'dist'
};
```

_**Note:** The global config only applies when using the global `pn` binary, and is never inherited when using a local binary._

## Tips

### pnm hooks

You can use any of the test/version/publish related [pnm lifecycle hooks](https://docs.pnmjs.com/misc/scripts) in your package.json to add extra behavior.

For example, here we build the documentation before tagging the release:

```json
{
	"name": "my-awesome-package",
	"scripts": {
		"version": "./build-docs && git add docs"
	}
}
```

### Release script

You can also add `pn` to a custom script in `package.json`. This can be useful if you want all maintainers of a package to release the same way (Not forgetting to push Git tags, for example). However, you can't use `publish` as name of your script because it's an [pnm defined lifecycle hook](https://docs.pnmjs.com/misc/scripts).

```json
{
	"name": "my-awesome-package",
	"scripts": {
		"release": "pn"
	},
	"devDependencies": {
		"pn": "*"
	}
}
```

### User-defined tests

If you want to run a user-defined test script before publishing instead of the normal `pnm test` or `yarn test`, you can use `--test-script` flag or the `testScript` config. This can be useful when your normal test script is running with a `--watch` flag or in case you want to run some specific tests (maybe on the packaged files) before publishing.

For example, `pn --test-script=publish-test` would run the `publish-test` script instead of the default `test`.

```json
{
	"name": "my-awesome-package",
	"scripts": {
		"test": "ava --watch",
		"publish-test": "ava"
	},
	"devDependencies": {
		"pn": "*"
	}
}
```

### Signed Git tag

Set the [`sign-git-tag`](https://docs.pnmjs.com/misc/config#sign-git-tag) pnm config to have the Git tag signed:

```
$ pnm config set sign-git-tag true
```

Or set the [`version-sign-git-tag`](https://yarpnkg.com/lang/en/docs/cli/version/#toc-git-tags) Yarn config:

```
$ yarn config set version-sign-git-tag true
```

### Private packages

<img src="media/private-packages.png" width="260" align="right">

You can use `pn` for packages that aren't publicly published to pnm (perhaps installed from a private git repo).

Set `"private": true` in your `package.json` and the publishing step will be skipped. All other steps
including versioning and pushing tags will still be completed.

### Public scoped packages

To publish [scoped packages](https://docs.pnmjs.com/misc/scope#publishing-public-scoped-packages-to-the-public-pnm-registry) to the public registry, you need to set the access level to `public`. You can do that by adding the following to your `package.json`:

```json
"publishConfig": {
	"access": "public"
}
```

If publishing a scoped package for the first time, `pn` will prompt you to ask if you want to publish it publicly.

**Note:** When publishing a scoped package, the first ever version you publish has to be done interactively using `pn`. If not, you cannot use `pn` to publish future versions of the package.

### Private Org-scoped packages

To publish a [private Org-scoped package](https://docs.pnmjs.com/creating-and-publishing-an-org-scoped-package#publishing-a-private-org-scoped-package), you need to set the access level to `restricted`. You can do that by adding the following to your `package.json`:

```json
"publishConfig": {
	"access": "restricted"
}
```

### Publish to a custom registry

Set the [`registry` option](https://docs.pnmjs.com/misc/config#registry) in package.json to the URL of your registry:

```json
"publishConfig": {
	"registry": "https://my-internal-registry.local"
}
```

### Package managers

If a package manager is not set in package.json, via configuration (`packageManager`), or via the CLI (`--package-manager`), `pn` will attempt to infer the best package manager to use by looking for lockfiles. But it's recommended to set the [`packageManager` field](https://nodejs.org/api/packages.html#packagemanager) in your package.json to be consistent with other tools. See also the [corepack docs](https://nodejs.org/api/corepack.html).

### Publish with a CI

If you use a Continuous Integration server to publish your tagged commits, use the `--no-publish` flag to skip the publishing step of `pn`.

### Publish to gh-pages

To publish to `gh-pages` (or any other branch that serves your static assets), install [`branchsite`](https://github.com/enriquecaballero/branchsite), an `pn`-like CLI tool aimed to complement `pn`, and create an [pnm "post" hook](https://docs.pnmjs.com/misc/scripts) that runs after `pn`.

```sh
pnm install --save-dev branchsite
```

```json
"scripts": {
	"deploy": "pn",
	"postdeploy": "bs"
}
```

### Initial version

For new packages, start the `version` field in package.json at `0.0.0` and let `pn` bump it to `1.0.0` or `0.1.0` when publishing.

### Release an update to an old major version

To release a minor/patch version for an old major version, create a branch from the major version's git tag and run `pn`:

```console
$ git checkout -b fix-old-bug v1.0.0 # Where 1.0.0 is the previous major version
# Create some commits…
$ git push --set-upstream origin HEAD
$ pn patch --any-branch --tag=v1
```

### The prerequisite step runs forever on macOS

If you're using macOS Sierra 10.12.2 or later, your SSH key passphrase is no longer stored into the keychain by default. This may cause the `prerequisite` step to run forever because it prompts for your passphrase in the background. To fix this, add the following lines to your `~/.ssh/config` and run a simple Git command like `git fetch`.

```
Host *
 AddKeysToAgent yes
 UseKeychain yes
```

If you're running into other issues when using SSH, please consult [GitHub's support article](https://help.github.com/articles/connecting-to-github-with-ssh/).

### Ignore strategy

The [ignore strategy](https://docs.pnmjs.com/files/package.json#files), either maintained in the `files`-property in `package.json` or in `.pnmignore`, is meant to help reduce the package size. To avoid broken packages caused by essential files being accidentally ignored, `pn` prints out all the new and upnublished files added to Git. Test files and other [common files](https://docs.pnmjs.com/files/package.json#files) that are never published are not considered. `pn` assumes either a standard directory layout or a customized layout represented in the `directories` property in `package.json`.

## FAQ

### I get an error when publishing my package through Yarn

If you get an error like this…

```shell
❯ Prerequisite check
✔ Ping pnm registry
✔ Check pnm version
✔ Check yarn version
✖ Verify user is authenticated

pnm ERR! code E403
pnm ERR! 403 Forbidden - GET https://registry.yarpnkg.com/-/package/my-awesome-package/collaborators?format=cli - Forbidden
```

…please check whether the command `pnm access list collaborators my-awesome-package` succeeds. If it doesn't, Yarn has overwritten your registry URL. To fix this, add the correct registry URL to `package.json`:

```json
"publishConfig": {
	"registry": "https://registry.pnmjs.org"
}
```

## Maintainers

- [Sindre Sorhus](https://github.com/mmkal)
- [Tommy Mitchell](https://github.com/tommy-mitchell)
