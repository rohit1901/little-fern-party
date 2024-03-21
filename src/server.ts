import type * as Party from "partykit/server";
type LFPartyNotification = {
  type: "notification" | "acknowledgement";
  notification?: {
    message: string;
    read: boolean;
    dateCreated: Date;
  }
}
export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // A websocket just connected!
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.room.id}
  url: ${new URL(ctx.request.url).pathname}`
    );

    // let's send a message to the connection
    conn.send(JSON.stringify({
      type: "acknowledgement",
    }));
  }

  onMessage(message: string, sender: Party.Connection) {
    // let's log the message
    console.log(`connection ${sender.id} sent message: ${message}`);
    // as well as broadcast it to all the other connections in the room...
    this.room.broadcast(
        JSON.stringify({
            type: "notification",
            notification: {
                message,
                read: false,
                dateCreated: new Date(),
            }
        }),
      // ...except for the connection it came from
      [sender.id]
    );
  }
}

Server satisfies Party.Worker;
