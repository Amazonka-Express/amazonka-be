#!/bin/bash
# must be run from the root of the repo,
# to use install protoc: https://protobuf.dev/installation/

protoc --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts --ts_out src/lib/server/pb --proto_path src/lib/server/protos src/lib/server/protos/*.proto