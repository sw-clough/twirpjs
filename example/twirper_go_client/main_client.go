// Copyright 2018 MyGnar, Inc.  All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"). You may not
// use this file except in compliance with the License. A copy of the License is
// located at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// or in the "license" file accompanying this file. This file is distributed on
// an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
// express or implied. See the License for the specific language governing
// permissions and limitations under the License.

// Adapted from https://github.com/twitchtv/twirp/tree/master/example

package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"

	"github.com/gnarbox/twirpjs/example/twirper"
)

var (
	echoReq = &twirper.EchoReq{
		Message: `Is any server out there?`,
	}
)

func main() {
	port := flag.Int(`p`, 8888, `the port on which the server is listening`)
	host := flag.String(`h`, `http://localhost`, `where to look for the server`)
	flag.Parse()

	fmt.Printf("Twirping the twirper server at %s:%d...\n", *host, *port)

	client := twirper.NewTwirperProtobufClient(
		fmt.Sprintf(`%s:%d`, *host, *port),
		http.DefaultClient,
	)

	var (
		echoResp *twirper.EchoReq
		err      error
	)

	echoResp, err = client.Echo(context.Background(), echoReq)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("\tResponse from Echo(%+v):\n\t\t%+v\n", echoReq, echoResp)

	fmt.Printf("\tGoodbye\n")
}
