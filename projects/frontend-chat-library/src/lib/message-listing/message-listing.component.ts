import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { RocketChatApiService } from '../services/rocket-chat-api/rocket-chat-api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'lib-message-listing',
  templateUrl: './message-listing.component.html',
  styleUrls: ['./message-listing.component.css']
})
export class MessageListingComponent implements OnInit, OnDestroy {
  config: any;
  messagesList: any[] = [];
  currentUser: any;
  ws!: WebSocket;
  constructor(
    private rocketChatApi: RocketChatApiService,
    private router: Router
  ) {}

  async ngOnInit() {
  let data :any = localStorage.getItem('userData'); 
  this.config = JSON.parse(data);
 this.initializeWebSocket();
    await this.rocketChatApi.setHeadersAndWebsocket(this.config, this.ws);
    this.currentUser = await this.rocketChatApi.getCurrentUserDetails();
    const roomList = await this.rocketChatApi.getRoomList(this.ws);
    const subscribedRooms = await this.rocketChatApi.getSubscribedRoomList(this.ws);
    const unreadMap = new Map(
      subscribedRooms.update.map((item: any) => [item.rid, item.unread])
    );

    this.messagesList = roomList.update.map((room: any) => ({
      ...room,
      name:
        room.usernames?.find(
          (str: any) => str !== this.config.user.userName
        ) ?? room.name,
      image: room.usernames
        ? `${this.config.rocketChatBaseUrl}/avatar/${
            room.usernames.find(
              (str: any) => str !== this.config.user.userName
            ) ?? 'default'
          }`
        : `${this.config.rocketChatBaseUrl}/avatar/default`,
      unread: unreadMap.get(room._id) || 0,
    }));

    this.sortMessages();

    // Subscribe to WebSocket messages
    await this.rocketChatApi.subscribeToChannels(this.config, this.ws);
  }

   initializeWebSocket() {
    this.ws = new WebSocket(this.config.websocketUrl);
    this.ws.onopen = () => console.log('WebSocket connected');
    this.ws.onclose = () => console.log('WebSocket closed');
    this.ws.onerror = (error:any) => console.error('WebSocket error:', error);
    this.ws.onmessage = async (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.msg === 'ping') {
        this.sendWebSocketMessage({ msg: 'pong' });
      }
      if (data.msg === 'changed' && data.fields) {
        const eventName = data.fields.eventName;
        const args = data.fields.args;

        if (eventName.includes('rooms-changed') && args[0] === 'updated') {
          const incomingMsgData = args[1];

          if (incomingMsgData.lastMessage) {
            const result = this.messagesList.find(
              (obj) => obj._id === incomingMsgData.lastMessage.rid
            );

            if (result) {
              result.lastMessage = incomingMsgData.lastMessage;
              result.unread += 1;
            } else {
              this.addNewMessage(incomingMsgData);
            }
            this.sortMessages();
          }
        }
      }
    };
  }

  private addNewMessage(incomingMsgData: any) {
    incomingMsgData.name =
      incomingMsgData.usernames?.find(
        (str: any) => str !== this.config.user.userName
      ) ?? incomingMsgData.name;

    incomingMsgData.image = incomingMsgData.usernames
      ? `${this.config.rocketChatBaseUrl}/avatar/${
          incomingMsgData.usernames.find(
            (str: any) => str !== this.config.user.userName
          ) ?? 'default'
        }`
      : `${this.config.rocketChatBaseUrl}/avatar/default`;

    incomingMsgData.unread = 1;

    this.messagesList.unshift(incomingMsgData);
  }

  private sortMessages() {
    this.messagesList.sort((a, b) => {
      const dateA = a.lastMessage
        ? new Date(a.lastMessage.ts).getTime()
        : new Date(0).getTime();
      const dateB = b.lastMessage
        ? new Date(b.lastMessage.ts).getTime()
        : new Date(0).getTime();
      return dateB - dateA;
    });
  }

  private sendWebSocketMessage(message: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  navigate(message: any) {
    console.log('Navigating to chat with message:', message);
    this.router.navigate(['chat'], { queryParams: { message: JSON.stringify(message) } });
  }

  ngOnDestroy() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
