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

    const unreadMap = new Map(subscribedRooms.update.map((item: any) => [item.rid, item.unread]));

    this.messagesList = roomList.update.map((room: any) => {
      return {
        ...room,
        name: room.usernames?.find((str: any) => str !== this.config.user.userName) ?? room.name,
        image: room.usernames
          ? `${this.config.rocketChatBaseUrl}/avatar/${room.usernames.find((str: any) => str !== this.config.user.userName)}`
          : `${this.config.rocketChatBaseUrl}/avatar/default`,
        unread: unreadMap.get(room._id)
      };
    });

    this.messagesList.sort((a: any, b: any) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.ts).getTime() : new Date(0).getTime();
      const dateB = b.lastMessage ? new Date(b.lastMessage.ts).getTime() : new Date(0).getTime();
      return dateB - dateA; // Sort in descending order
    });

    //subscribe to rooms and all
    await this.rocketChatApi.subscribeToChannels(this.config, this.ws);

    //Configure websocket recieving a message
    this.ws.onmessage = async (event: any) => {
      let data = JSON.parse(event.data)
      if (data.msg === 'ping') {
        const pongMessage = {
          msg: 'pong',
        };
        this.ws.send(JSON.stringify(pongMessage));
      }
      if (data.msg === 'changed' && data.fields) {
        const eventName = data.fields.eventName;
        const args = data.fields.args;
        if (eventName.includes('rooms-changed') && args[0] === 'updated') {
          const incomingMsgData = args[1];
          // console.log(incomingMsgData, this.messagesList)
          if (incomingMsgData.lastMessage) {
            const result = this.messagesList.find((obj: any) => obj._id === incomingMsgData.lastMessage.rid);
            if(result){
              result.lastMessage = incomingMsgData?.lastMessage;
              result.unread = result.unread + 1;
            }
            const objIndex = this.messagesList.findIndex((obj: any) => obj._id === incomingMsgData.lastMessage.rid);
            if (objIndex !== -1) {
              const [obj] = this.messagesList.splice(objIndex, 1); // Remove and store the object
              this.messagesList.unshift(obj); // Add the object to the beginning of the array
            } else {

              let subscribedRooms = await this.rocketChatApi.getSubscribedRoomList(this.ws)

              const unreadMap = new Map(subscribedRooms.update.map((item: any) => [item.rid, item.unread]));
              this.messagesList.unshift(incomingMsgData)

              incomingMsgData.name = incomingMsgData.usernames?.find((str: any) => str !== this.config.user.userName) ?? incomingMsgData.name,
              incomingMsgData.image = incomingMsgData.usernames
                ? `${this.config.rocketChatBaseUrl}/avatar/${incomingMsgData.usernames.find((str: any) => str !== this.config.user.userName)}`
                : `${this.config.rocketChatBaseUrl}/avatar/default`,
              incomingMsgData.unread = unreadMap.get(incomingMsgData._id)
            }
          }
        }
      }
    }
  }
}
