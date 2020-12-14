#!/bin/bash

mkdir all_plugins
cd all_plugins
git clone https://gitlab+deploy-token-1154:4FjfyyojYyJMPfauAXGq@gitlab.us.lmco.com/mbx/mbee/plugins/mms3-adapter.git
cd ../

for D in `find all_plugins -type d -maxdepth 1`
do
    # echo $D
    if [ $D != "all_plugins" ]; then
        echo $D
        (cd $D && yarn install)
    fi
done
