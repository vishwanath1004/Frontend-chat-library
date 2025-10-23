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
  @Output() toastMessageEvent = new EventEmitter<any>();
  @Input() translatedMessages: any;
  messagesList: any;
  currentUser: any;
  ws: any;
  rid: any;
  searchTerm: string = ''; 
  filteredMessagesList: any[] = [];
  loading: boolean = true;

  constructor(
    private rocketChatApi: RocketChatApiService,
    private router: Router,
    private chatService: FrontendChatLibraryService
  ) {}

  async ngOnInit() {
    this.loading = true;
    this.config = this.chatService.config;
    this.ws = new WebSocket(this.config.chatWebSocketUrl);
    await this.rocketChatApi.setHeadersAndWebsocket(this.config, this.ws);
    this.currentUser = await this.rocketChatApi.getCurrentUserDetails();
  
    let roomList = await this.rocketChatApi.getRoomList(this.ws);
    let subscribedRooms = await this.rocketChatApi.getSubscribedRoomList(this.ws);
  
    const unreadMap = new Map(
      subscribedRooms.update.map((item: any) => [item.rid, item.unread])
    );
    const fnameMap = new Map(
      subscribedRooms.update.map((item: any) => [item.rid, item.fname])
    );
  
    this.messagesList = await Promise.all(
      roomList.update.map(async (room: any) => {
        const otherUsername = room.usernames?.find(
          (str: any) => str !== this.currentUser.username
        ) ?? 'default';
  
        const image = await this.rocketChatApi.resolveImageUrl(otherUsername);
  
        return {
          ...room,
          name: fnameMap.get(room._id) ?? room.name,
          image,
          unread: unreadMap.get(room._id),
          time: new Date(room.ts).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
      })
    );
  
    // Sort initially by recent messages
    this.messagesList.sort((a: any, b: any) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.ts).getTime() : 0;
      const dateB = b.lastMessage ? new Date(b.lastMessage.ts).getTime() : 0;
      return dateB - dateA;
    });
  
    this.filteredMessagesList = this.messagesList;
    this.loading = false;
    let msgList = await this.rocketChatApi.subscribeToChannels(this.config, this.ws);
    this.ws.onmessage = async (event: any) => {
      let data = JSON.parse(event.data);
      if (data.msg === 'ping') {
        const pongMessage = { msg: 'pong' };
        this.ws.send(JSON.stringify(pongMessage));
      }
      if (data.msg === 'changed' && data.fields) {
        const eventName = data.fields.eventName;
        const args = data.fields.args;
  
        if (eventName.includes('rooms-changed') && args[0] === 'updated') {
          const incomingMsgData = args[1];
  
          if (incomingMsgData.lastMessage) {
            const roomIndex = this.messagesList.findIndex(
              (obj: any) => obj._id === incomingMsgData.lastMessage.rid
            );
            if (roomIndex !== -1) {
              const room = this.messagesList[roomIndex];
              room.lastMessage = incomingMsgData.lastMessage;
              if(room.lastMessage.u._id != this.currentUser._id) {
                room.unread += 1;
              }
              const [updatedRoom] = this.messagesList.splice(roomIndex, 1);
              this.messagesList.unshift(updatedRoom);
            } else {
              let subscribedRooms = await this.rocketChatApi.getSubscribedRoomList(this.ws);
              const unreadMap = new Map(
                subscribedRooms.update.map((item: any) => [item.rid, item.unread])
              );
  
              const otherUsername = incomingMsgData.usernames?.find(
                (str: any) => str !== this.currentUser.username
              ) ?? 'default';
  
              const image = await this.rocketChatApi.resolveImageUrl(otherUsername);
  
              incomingMsgData.name = fnameMap.get(incomingMsgData._id) ?? incomingMsgData.name;
              incomingMsgData.image = image;
              incomingMsgData.unread = unreadMap.get(incomingMsgData._id);
              this.messagesList.unshift(incomingMsgData);
            }
            this.messagesList.sort((a: any, b: any) => {
              const dateA = a.lastMessage ? new Date(a.lastMessage.ts).getTime() : 0;
              const dateB = b.lastMessage ? new Date(b.lastMessage.ts).getTime() : 0;
              return dateB - dateA;
            });
          }
        }
      }
    };
  }
  

  filterMessages(event: any) {
  if (event.length >= 3) {
    this.filteredMessagesList = this.messagesList.filter((message: any) =>
        message.name.toLowerCase().includes(event.toLowerCase())
      );
  } else if(event.length > 0 && event.length < 3) {
    let toastMessage = {
      message: 'ENTER_MIN_CHARACTER',
      type: 'danger'
    }
    this.toastMessageEvent.emit(toastMessage);
  }else{
    this.filteredMessagesList = this.messagesList;
  }
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
  clearSearch() {
    this.searchTerm = '';
    this.filteredMessagesList = this.messagesList.filter((message: any) =>
        message.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
  }
}
