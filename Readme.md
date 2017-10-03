# OONI Probe CLI

**WARNING** :skull: This is far from being ready for real usage. If you are not a developer, look away :see_no_evil:

The Command Line Interface for running OONI Probe on desktop.

## Developers, developers, developers

You are expected to have a working node installation and yarn.

If that is the case do:

```
yarn install
yarn dev
```

Live reloading will start.

Edit files and run the CLI with:

```
node dist/ooni.js
```

## TODO

*CLI related*

* Ensure all CLI tools are using the `src/cli/ouput/options` utilities
* Do something similar to what is done for options, for test names to make them wrap nicely (see: `ooni nt --help`)
* Start mocking out all the remaining commands following the pattern used for
  `nettest` and where necessary refactor things into `cli/ouput` utilities
* Check that the help command works as expected everywhere

*Core*

* Integrate measurement-kit-node to run the tests
* Add support for storing measurement results using something like level-db or similar
