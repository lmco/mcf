#!/bin/bash
mkdir -p /lm/mbee/data/db/log
touch /lm/mbee/data/db/log/mbee-db.log
chown mongodb:mongodb /lm/mbee/data/db
chmod +w /lm/mbee/data/db/log/mbee-db.log
mongod --dbpath /lm/mbee/data/db \
       --bind_ip 127.0.0.1 \
       --fork \
       --logpath /lm/mbee/data/db/log/mbee-db.log
sleep 2
node mbee start
