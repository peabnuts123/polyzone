#!/usr/bin/env bash

cloc src \
  --by-file-by-lang \
  --exclude-dir=\
node_modules,\
target,\
dist,\
.next,\
coverage,\
package-lock.json;
