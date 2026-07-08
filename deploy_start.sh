#!/usr/bin/env bash
set -e

mkdir -p /home/runner/workspace/.mongodb/data
mongod --dbpath /home/runner/workspace/.mongodb/data --port 27017 --bind_ip 127.0.0.1 &

for i in $(seq 1 30); do
  if mongo --port 27017 --eval "db.runCommand({ ping: 1 })" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

cd /home/runner/workspace/backend
uvicorn server:app --host 0.0.0.0 --port 8000 &

cd /home/runner/workspace/prodserver
exec node server.js
