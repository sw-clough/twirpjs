RETOOL=$(CURDIR)/_tools/bin/retool -base-dir `pwd`
PATH := ${PWD}/bin:${PWD}/_tools/bin:${PATH}
.DEFAULT_GOAL := all

all: setup generate run-server

setup:
	./install_proto.bash
	# Install retool, dep, protoc-gen-go, protoc-gen-twirp, and vendored go dependencies
	GOPATH=$(CURDIR)/_tools go install "github.com/twitchtv/retool/..."
	$(RETOOL) build
	$(RETOOL) do dep ensure -v

generate:
	$(RETOOL) do protoc --go_out=twirper --twirp_out=twirper twirper.proto
	@$(MAKE) -C twirper_react_client all

run-server:
	GOBIN=$(CURDIR)/bin go install -v ./twirper_go_server
	./bin/twirper_go_server

run-go-client:
	GOBIN=$(CURDIR)/bin go install -v ./twirper_go_client
	$(eval client=./bin/twirper_go_client)
	@echo "\n### Running client with default options"
	$(client)
