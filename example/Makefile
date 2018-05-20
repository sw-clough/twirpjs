RETOOL=$(CURDIR)/_tools/bin/retool
PATH := ${PWD}/bin:${PWD}/_tools/bin:${PATH}
.DEFAULT_GOAL := all

all: setup generate run-server

setup:
	./install_proto.bash
	# Install retool, dep, protoc-gen-go, and vendored go dependencies
	GOPATH=$(CURDIR)/_tools go install "github.com/twitchtv/retool/..."
	$(RETOOL) build
	$(RETOOL) do dep ensure -v
	# Install the gnarbox fork of twirp/protoc-gen-twirp (see ./Gopkg.toml)
	### TODO: Add dep-style support for forks to retool
	### (i.e. retool add github.com/twitchtv/twirp/protoc-gen-twirp:github.com/gnarbox/twirp/protoc-gen-twirp)
	GOBIN="${PWD}/_tools/bin" go install -v "github.com/twitchtv/twirp/protoc-gen-twirp"

generate:
	$(RETOOL) do protoc --go_out=twirper --twirp_out=twirper twirper.proto

build: bin/twirper_go_server bin/twirper_go_client
./bin/twirper_go_server:
	GOBIN=$(CURDIR)/bin go install -v ./twirper_go_server
./bin/twirper_go_client: twirper_go_client/*.go
	GOBIN=$(CURDIR)/bin go install -v ./twirper_go_client

run-server:
	# Running twirper_go_server...
	# You can try out the go client in another shell with 'make run-go-client' (or ./bin/twirper_go_client)
	@# twirper_go_server
	@### With "go run" instead... ###
	go run twirper_go_server/*.go

run-go-client:
	@# @echo "\n### Running client with default options"
	@# twirper_go_client
	@# @echo "\n### Running again, but have the server return an error after the fifth message"
	@# twirper_go_client -err 5 || true
	@# @echo "\n### Cancel the request context after the fifth message"
	@# twirper_go_client -c 5 || true
	@# @echo "\n### Call End() on the response stream after the fifth message"
	@# twirper_go_client -e 5 || true
	@### With "go run" instead... ###
	@echo "\n### Running client with default options"
	go run twirper_go_client/*.go
	@echo "\n### Running again, but have the server return an error after the fifth message"
	go run twirper_go_client/*.go -err 5 || true
	@echo "\n### Cancel the request context after the fifth message"
	go run twirper_go_client/*.go -c 5 || true
	@echo "\n### Call End() on the response stream after the fifth message"
	go run twirper_go_client/*.go -e 5 || true
