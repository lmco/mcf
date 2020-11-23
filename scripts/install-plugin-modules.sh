#!/bin/bash

for D in `find all_plugins -type d -maxdepth 1`
do
    # echo $D
    if [ $D != "all_plugins" ]; then
        echo $D
        (cd $D && yarn install)
    fi
done