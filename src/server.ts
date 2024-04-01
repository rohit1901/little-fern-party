import { verify as hCaptchaVerify } from "./hcaptcha";
import type * as Party from "partykit/server";
import * as jose from "jose";

type LFPartyNotification = {
  type: "notification" | "acknowledgement";
  notification?: {
    message: string;
    read: boolean;
    dateCreated: Date;
  };
};

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  static async onBeforeConnect(req: Party.Request) {
    // Check if the request is authorized
    try {
      const token = new URL(req.url).searchParams.get("token");
      if (!token) {
        return new Response("Unauthorized", { status: 401 });
      }
      const JWKS = jose.createRemoteJWKSet(
        new URL(
          `${process.env.NEXT_PUBLIC_AUTH0_ISSUER}/.well-known/jwks.json`,
        ),
      );

      const { payload: user } = await jose.jwtVerify(token, JWKS, {
        issuer: `${process.env.NEXT_PUBLIC_AUTH0_ISSUER}/`,
      });
      console.info(`User ${user.sub} authenticated`);
      // forward the request onwards on onConnect
      return req;
    } catch (e) {
      console.error(e);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    try {
      // A websocket just connected!
      console.info(
        `Connected: id: ${conn.id}, room: ${this.room.id}, url: ${new URL(ctx.request.url).pathname}`,
      );

      // let's send a message to the connection
      conn.send(
        JSON.stringify({
          type: "acknowledgement",
        }),
      );
    } catch (e) {
      console.error("Internal Server Error", e);
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      // let's log the message
      console.info(`connection ${sender.id} sent message: ${message}`);
      // as well as broadcast it to all the other connections in the room...
      this.room.broadcast(
        JSON.stringify({
          type: "notification",
          notification: {
            message,
            read: false,
            dateCreated: new Date(),
          },
        }),
        // ...except for the connection it came from
        [sender.id],
      );
    } catch (e) {
      console.error("Internal Server Error", e);
    }
  }

  async onRequest(request: Party.Request) {
    try {
      // push new message
      if (request.method === "POST") {
        const payload: LFPartyNotification & {
          token?: string;
        } = await request.json();
        if (!payload.token)
          return new Response("Missing hCaptcha token", { status: 400 });
        const data = await hCaptchaVerify(
          process.env.NEXT_PUBLIC_HCAPTCHA_SECRET,
          payload.token,
        );
        if (data.success) {
          console.info("Successfully verified hCaptcha token");
          const partyNotification = JSON.stringify({
            type: "notification",
            notification: payload.notification,
          });
          console.info("Received notification:", partyNotification);
          this.room.broadcast(partyNotification);
          return new Response("OK", { status: 200 });
        }
        console.error("Failed to verify hCaptcha token", data);
        return new Response("Invalid hCaptcha token", { status: 400 });
      }
      return new Response("Invalid request", { status: 400 });
    } catch (e) {
      console.error(e);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
}
// @eslint-ignore-next-line
// noinspection BadExpressionStatementJS
Server satisfies Party.Worker;
