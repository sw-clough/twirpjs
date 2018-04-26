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
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gnarbox/twirpjs/example/twirper"
	// "github.com/rs/cors" // CORS handling for twirper web client
	"github.com/twitchtv/twirp"
)

func errAborted(err error) error {
	if err == nil {
		return twirp.NewError(twirp.Aborted, `canceled`).WithMeta(`cause`, `unknown`)
	}
	return twirp.NewError(twirp.Aborted, err.Error()).WithMeta("cause", fmt.Sprintf("%#v", err))
}

type repeatRespStream struct {
	req      *twirper.RepeatReq
	lastTime time.Time
	repeated int32
}

func newRepeatRespStream(req *twirper.RepeatReq) *repeatRespStream {
	return &repeatRespStream{req, time.Now(), 0}
}

func (rs *repeatRespStream) Next(ctx context.Context) (*twirper.RepeatResp, error) {
	if rs.req.ErrAfter != 0 && rs.repeated == rs.req.ErrAfter {
		err := fmt.Errorf(`you wanted this`)
		log.Printf("(repeatRespStream#Next) Client requested an error, returning error %#v", err)
		return nil, err
	}
	if rs.repeated == rs.req.NumRepeats {
		log.Printf("(repeatRespStream#Next) Returning %#v", io.EOF)
		return nil, io.EOF
	}
	rs.repeated++

	select {
	case <-ctx.Done():
		err := errAborted(ctx.Err())
		log.Printf(
			`(repeatRespStream#Next) Context canceled, returning error "%+v"`+
				" (Note: this error goes nowhere because the connection is closed)\n",
			err,
		)
		return nil, err
		// // Things get really weird if you don't return an error...
		// return &twirper.RepeatResp{Message: err.Error()}, nil

	case <-time.After(time.Duration(rs.req.DelayMs) * time.Millisecond):
		resp := &twirper.RepeatResp{
			Message:   rs.req.Message,
			DelayedMs: time.Since(rs.lastTime).Nanoseconds() / 1000000,
			ID:        rs.repeated,
		}
		rs.lastTime = time.Now()
		log.Printf("(repeatRespStream#Next) Returning %#v", *resp)
		return resp, nil
	}
}

// For a sender, End will be called by generated code when we're going to stop
// sending messages for any reason: either we have received nil, io.EOF from a
// call to Next, or we have to shut down for some other reason (like the
// receiver went away).
// [from https://github.com/twitchtv/twirp/issues/70#issuecomment-361454005]
func (rs *repeatRespStream) End(err error) {
	log.Printf("(repeatRespStream#End) Stream ended with %#v\n", err)
}

type theTwirper struct{}

func (tt *theTwirper) Echo(ctx context.Context, req *twirper.EchoReq) (*twirper.EchoReq, error) {
	fmt.Println()
	log.Printf("(theTwirper#Echo) Echo called with %#v", req)
	if req.Message == `` {
		err := twirp.InvalidArgumentError(`Message`, `I won't be silent`)
		log.Printf("(theTwirper#Echo) Returning %#v", err)
		return nil, err
	}
	log.Printf("(theTwirper#Echo) Returning %#v", req)
	return req, nil
}

func (tt *theTwirper) Repeat(ctx context.Context, req *twirper.RepeatReq) (twirper.RepeatRespStream, error) {
	fmt.Println()
	log.Printf("(theTwirper#Repeat) Repeat called with %#v", req)
	if req.Message == `` {
		return nil, twirp.InvalidArgumentError(`Message`, `I won't be silent`)
	}
	if req.NumRepeats <= 0 {
		return nil, twirp.InvalidArgumentError(`NumRepeats`, `I won't be silent`)
	}
	return newRepeatRespStream(req), nil
}

func main() {
	server := twirper.NewTwirperServer(&theTwirper{}, nil)
	// handler := cors.Default().Handler(server) // Wrap the server with a liberal (unsafe?) cors policy
	log.Println(`Listening on port 8888`)
	log.Fatal(http.ListenAndServe(`:8888`, server))
}
