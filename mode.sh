#!/bin/bash
readonly INDEX_PATH='\.\.\/elvis\/web\/pkg';
readonly SRC_PATH='\.\.\/\.\.\/elvis\/web\/pkg';

if [[ -e .dev.lock ]]; then
    rm .dev.lock
    sed -i '.bak' "s/${INDEX_PATH}/elvis-web/g" index.ts
    sed -i '.bak' "s/${SRC_PATH}/elvis-web/g" src/*.ts
    rm *.bak src/*.bak
    echo '[npm]: convert calling-elvis into npm mode'
else
    touch .dev.lock
    sed -i '.bak' "s/elvis-web/${INDEX_PATH}/g" index.ts
    sed -i '.bak' "s/elvis-web/${SRC_PATH}/g" src/*.ts
    rm *.bak src/*.bak
    echo '[dev]: convert calling-elvis into development mode'
fi
