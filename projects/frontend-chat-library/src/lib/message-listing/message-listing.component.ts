import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { RocketChatApiService } from '../services/rocket-chat-api/rocket-chat-api.service';
import { Router } from '@angular/router';
import { FrontendChatLibraryService } from '../frontend-chat-library.service';
import { urlConstants } from '../constants/urlConstants';

@Component({
  selector: 'lib-message-listing',
  templateUrl: './message-listing.component.html',
  styleUrls: ['./message-listing.component.css'],
})
export class MessageListingComponent implements OnInit {
  @Input() config: any;
  @Output() onSelect = new EventEmitter();
  @Output() newMessageEvent = new EventEmitter<any>();
  messagesList: any;
  currentUser: any;
  ws: any;
  rid: any;

  constructor(
    private rocketChatApi: RocketChatApiService,
    private router: Router,
    private chatService: FrontendChatLibraryService
  ) {}

  async ngOnInit() {
    this.config = this.chatService.config;
    this.ws = new WebSocket(urlConstants.websocketUrl);
    await this.rocketChatApi.setHeadersAndWebsocket(this.config, this.ws);
    this.currentUser = await this.rocketChatApi.getCurrentUserDetails();
    let roomList = await this.rocketChatApi.getRoomList(this.ws);
    let subscribedRooms = await this.rocketChatApi.getSubscribedRoomList(
      this.ws
    );

    const unreadMap = new Map(
      subscribedRooms.update.map((item: any) => [item.rid, item.unread])
    );
    this.messagesList = roomList.update.map((room: any) => {
      return {
        ...room,
        name:
          room.usernames?.find(
            (str: any) => str !== this.currentUser.username
          ) ?? room.name,
        image: room.usernames
          ? `${urlConstants.BASE_URL}/avatar/${room.usernames.find(
              (str: any) => str !== this.currentUser.username
            )}`
          : `${urlConstants.BASE_URL}/avatar/default`,
        unread: unreadMap.get(room._id),
        time: new Date(room.ts).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    });
    this.messagesList.sort((a: any, b: any) => {
      const dateA = a.lastMessage
        ? new Date(a.lastMessage.ts).getTime()
        : new Date(0).getTime();
      const dateB = b.lastMessage
        ? new Date(b.lastMessage.ts).getTime()
        : new Date(0).getTime();
      return dateA - dateB;
    });

    let msgList = await this.rocketChatApi.subscribeToChannels(
      this.config,
      this.ws
    );
    this.ws.onmessage = async (event: any) => {
      let data = JSON.parse(event.data);
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
          if (incomingMsgData.lastMessage) {
            const result = this.messagesList.find(
              (obj: any) => obj._id === incomingMsgData.lastMessage.rid
            );
            if (result) {
              result.lastMessage = incomingMsgData?.lastMessage;
              result.unread = result.unread + 1;
            }
            const objIndex = this.messagesList.findIndex(
              (obj: any) => obj._id === incomingMsgData.lastMessage.rid
            );
            if (objIndex !== -1) {
              const [obj] = this.messagesList.splice(objIndex, 1);
              this.messagesList.push(obj);
            } else {
              let subscribedRooms =
                await this.rocketChatApi.getSubscribedRoomList(this.ws);
              const unreadMap = new Map(
                subscribedRooms.update.map((item: any) => [
                  item.rid,
                  item.unread,
                ])
              );

              this.messagesList.unshift(incomingMsgData);
              (incomingMsgData.name =
                incomingMsgData.usernames?.find(
                  (str: any) => str !== this.currentUser.username
                ) ?? incomingMsgData.name),
                (incomingMsgData.image = incomingMsgData.usernames
                  ? `${
                      urlConstants.BASE_URL
                    }/avatar/${incomingMsgData.usernames.find(
                      (str: any) => str !== this.currentUser.username
                    )}`
                  : `${urlConstants.BASE_URL}/avatar/default`),
                (incomingMsgData.unread = unreadMap.get(incomingMsgData._id));
            }
            this.messagesList.sort((a: any, b: any) => {
              const dateA = a.lastMessage
                ? new Date(a.lastMessage.ts).getTime()
                : new Date(0).getTime();
              const dateB = b.lastMessage
                ? new Date(b.lastMessage.ts).getTime()
                : new Date(0).getTime();
              return dateA - dateB;
            });
            const hasUnreadMessages = this.messagesList.some(
              (room: any) => room.unread > 0
            );
            this.newMessageEvent.emit(hasUnreadMessages);
            this.chatService.messageBadge(hasUnreadMessages);
          }
        }
      }
    };
  }

  navigate(message: any) {
    const payload = {
      url: urlConstants.API_URLS.MARK_AS_READ,
      payload: {
        rid: message.lastMessage.rid,
      },
    };

    this.rocketChatApi.marksAsRead(this.ws, payload);
    const roomIndex = this.messagesList.findIndex(
      (room: any) => room._id === message.lastMessage.rid
    );
    if (roomIndex !== -1) {
      this.messagesList[roomIndex].unread = 0;
    }

    const hasUnreadMessages = this.messagesList.some(
      (room: any) => room.unread > 0
    );
    if (hasUnreadMessages) {
      this.newMessageEvent.emit(true);
      this.chatService.messageBadge(hasUnreadMessages);
    } else {
      this.newMessageEvent.emit(false);
    }
    this.onSelect.emit(message.lastMessage.rid);
    this.rid = message.lastMessage.rid;
  }
  ngOnDestroy() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
