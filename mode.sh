#!/bin/bash
readonly index_path='\.\.\/\.\.\/\.\.\/elvis\/web\/pkg';
readonly src_path='\.\.\/\.\.\/\.\.\/\.\.\/elvis\/web\/pkg';

if [[ -e .dev.lock ]]; then
    rm .dev.lock
    cd ./packages/calling-elvis
    sed -i '.bak' "s/${index_path}/elvis-web/g" index.ts
    sed -i '.bak' "s/${src_path}/elvis-web/g" src/*.ts
    rm *.bak src/*.bak
    echo '[npm]: convert calling-elvis into npm mode'
else
    touch .dev.lock
    cd ./packages/calling-elvis
    sed -i '.bak' "s/elvis-web/${index_path}/g" index.ts
    sed -i '.bak' "s/elvis-web/${src_path}/g" src/*.ts
    rm *.bak src/*.bak
    echo '[dev]: convert calling-elvis into development mode'
fi
