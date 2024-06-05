import { Component, Input, OnInit } from '@angular/core';
import { RocketChatApiService } from '../services/rocket-chat-api/rocket-chat-api.service';

@Component({
  selector: 'lib-message-listing',
  templateUrl: './message-listing.component.html',
  styleUrls: ['./message-listing.component.css']
})
export class MessageListingComponent implements OnInit {

  @Input() config: any
  messagesList: any;
  currentUser: any;
  ws: any;

  constructor(private rocketChatApi: RocketChatApiService) { }

  async ngOnInit() {
    this.ws = new WebSocket(this.config.websocketUrl);
    // Headers and websocket
    await this.rocketChatApi.setHeadersAndWebsocket(this.config, this.ws)

    //Get current user details
    this.currentUser = await this.rocketChatApi.getCurrentUserDetails();

    //Room list
    let roomList = await this.rocketChatApi.getRoomList(this.ws);

    let subscribedRooms = await this.rocketChatApi.getSubscribedRoomList(this.ws)

    const unreadMap = new Map(subscribedRooms.update.map((item:any) => [item.rid, item.unread]));

    this.messagesList = roomList.update.map((room: any) => {
      return {
        ...room,
        name: room.usernames?.find((str: any) => str !== this.config.user.userName) ?? room.name,
        image: room.usernames 
          ? `${this.config.rocketChatBaseUrl}/avatar/${room.usernames.find((str:any) => str !== this.config.user.userName)}`
          : `${this.config.rocketChatBaseUrl}/avatar/default`,
        unread: unreadMap.get(room._id)
      };
    });

    //subscribe to rooms and all
    // this.ws.send(JSON.stringify({
    //   "msg": "sub",
    //   "id": '' + new Date().getTime(), // unique ID for subscription
    //   "name": "stream-room-messages", // name of the subscription
    //   "params": [['YwisTMuma3efTJwc7gGQMHdbEJ9WPqWwdf'], {
    //     "useCollection": false,
    //     "args": []
    //   }]
    // }));
    // this.ws.send(JSON.stringify(
    //   { 
    //     "msg": "sub",
    //     "id": '' + new Date().getTime(),
    //     "name": "stream-notify-user",
    //     "params": ["gGQMHdbEJ9WPqWwdf/rooms-changed",
    //     { 
    //       "useCollection": false,
    //       "args": []
    //     }] 
    //   }))
  }
  // setWebsocket() {
    
  //   this.ws.onmessage = (result: any) => {

  //     if (JSON.parse(result.data).msg === 'ping') {
  //       // If a ping message is received, respond with a pong message
  //       const pongMessage = {
  //         msg: 'pong',
  //       };
  //       this.ws.send(JSON.stringify(pongMessage));
  //     } else {
  //       if (JSON.parse(result.data).msg == 'changed') {
  //         console.log(JSON.parse(result?.data))
  //         this.messagesList.push(JSON.parse(result.data).fields?.args[1].lastMessage)
  //         console.log(this.messagesList)
  //       }
  //       // const data = JSON.parse(result?.data || {});
  //       // const userFound = this.users.find(u => u.id === data.id);
  //       // if (userFound) {
  //       //   userFound.messages.push(
  //       //     new Message('replies', data.message, Date.now().toLocaleString())
  //       //   )
  //       // }
  //     }
  //   };
  // }

}
