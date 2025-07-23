import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { urlConstants } from '../../constants/urlConstants';
import { FrontendChatLibraryService } from '../../frontend-chat-library.service';

@Injectable({
  providedIn: 'root',
})
export class RocketChatApiService {
  baseUrl: any;
  headers: any;
  private ws: WebSocket | null = null;
  private messagesList: any[] = [];
  public isWebSocketInitialized = false;
  constructor(
    private http: HttpClient,
    private chatService: FrontendChatLibraryService
  ) {}

  async setHeadersAndWebsocket(config: any, ws: any) {
    this.baseUrl = config.chatBaseUrl;
    this.headers = {
      'X-Auth-Token': config.xAuthToken,
      'X-User-Id': config.userId,
      // You can add more headers if needed
    };
    ws.onopen = (event: any) => {
      const connectionMessage = {
        msg: 'connect',
        version: '1',
        support: ['1', 'pre2', 'pre1'],
      };
      ws.send(JSON.stringify(connectionMessage));
      ws.send(
        JSON.stringify({
          msg: 'method',
          id: new Date().getTime().toString(),
          method: 'login',
          params: [{ resume: config.xAuthToken }],
        })
      );
      ws.send(
        JSON.stringify({
          msg: 'sub',
          id: new Date().getTime().toString(),
          name: 'meteor.loginServiceConfiguration',
          params: [],
        })
      );
    };
  }

  async getRoomList(ws: WebSocket): Promise<any> {
    const url = `${this.baseUrl}${urlConstants.API_URLS.GET_DIRECT_MESSAGES_LIST}`;
    const httpOptions = {
      headers: new HttpHeaders(this.headers),
    };

    return lastValueFrom(this.http.get(url, httpOptions));
  }

  async getCurrentUserDetails(): Promise<any> {
    const url = `${this.baseUrl}${urlConstants.API_URLS.GET_MY_PROFILE_DETAIL}`;
    const httpOptions = {
      headers: new HttpHeaders(this.headers),
    };

    return lastValueFrom(this.http.get(url, httpOptions));
  }

  async getRoomInfo(roomId: any) {
    const url = `${this.baseUrl}${urlConstants.API_URLS.ROOM_INFO}?roomId=${roomId}`;
    const httpOptions = {
      headers: new HttpHeaders(this.headers),
    };

    return lastValueFrom(this.http.get(url, httpOptions));
  }
  async getUserInfoByUsername(username: string): Promise<any> {
    const url = `${this.baseUrl}${urlConstants.API_URLS.GET_USER_DETAILS_BY_USERNAME}${username}`;
    const httpOptions = {
      headers: new HttpHeaders(this.headers),
    };

    return lastValueFrom(this.http.get(url, httpOptions));
  }

  async getSubscribedRoomList(ws: WebSocket): Promise<any> {
    const url = `${this.baseUrl}${urlConstants.API_URLS.SUBSCRIPTION_GET}`;
    const httpOptions = {
      headers: new HttpHeaders(this.headers),
    };

    return lastValueFrom(this.http.get(url, httpOptions));
  }

  async getChatHistory(ws: WebSocket, payload: any): Promise<any> {
    const httpOptions = {
      headers: new HttpHeaders(this.headers),
    };

    return lastValueFrom(
      this.http.post(
        `${this.baseUrl}${payload?.url}`,
        payload?.payload,
        httpOptions
      )
    );
  }

  async subscribeToRoomChat(config: any, ws: any, rid: any, id: any) {
    ws.send(
      JSON.stringify({
        msg: 'sub',
        id: id,
        name: 'stream-room-messages',
        params: [
          rid,
          {
            useCollection: false,
            args: [
              {
                visitorToken: 'gGQMHdbEJ9WPqWwdftbdqsLmqsXhgoxqHq',
              },
            ],
          },
        ],
      })
    );
  }
  async subscribeToChannels(config: any, ws: any) {
    ws.send(
      JSON.stringify({
        msg: 'sub',
        id: '' + new Date().getTime(),
        name: 'stream-room-messages',
        params: [
          {
            useCollection: false,
            args: [],
          },
        ],
      })
    );
    ws.send(
      JSON.stringify({
        msg: 'sub',
        id: '' + new Date().getTime(),
        name: 'stream-notify-user',
        params: [
          config.userId + '/rooms-changed',
          {
            useCollection: false,
            args: [],
          },
        ],
      })
    );
    ws.send(
      JSON.stringify({
        msg: 'sub',
        id: '' + new Date().getTime(),
        name: 'stream-notify-all',
        params: [
          'public-settings-changed',
          {
            useCollection: false,
            args: [],
          },
        ],
      })
    );
    ws.send(
      JSON.stringify({
        msg: 'sub',
        id: '' + new Date().getTime(),
        name: 'stream-notify-all',
        params: [
          {
            useCollection: false,
            args: [],
          },
        ],
      })
    );
  }

  async marksAsRead(ws: WebSocket, payload: any): Promise<any> {
    const httpOptions = {
      headers: new HttpHeaders(this.headers),
    };
    return lastValueFrom(
      this.http.post(
        `${this.baseUrl}${payload?.url}`,
        payload?.payload,
        httpOptions
      )
    );
  }

  async initializeWebSocketAndCheckUnread() {
    const config = this.chatService.config;
    this.ws = new WebSocket(config.chatWebSocketUrl);
      this.ws.onmessage = async (event: any) => {
      const data = JSON.parse(event.data);
      
      if (data.msg === 'ping') {
        this.ws?.send(JSON.stringify({ msg: 'pong' }));
      }
      
      if (data.msg === 'connected') {
        await this.subscribeToChannels(config, this.ws!);
      }
      
      if (data.msg === 'changed' && data.fields && !this.isWebSocketInitialized) {
        await this.handleMessageChangeEvent(data.fields, currentUser);
      }
    };
    await this.setHeadersAndWebsocket(config, this.ws!);
    const currentUser = await this.getCurrentUserDetails();
    await this.loadInitialMessages(this.ws!, config, currentUser);

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
    };
  }

private async loadInitialMessages(ws: WebSocket, config: any, currentUser: any) {
  const [roomList, subscribedRooms, ] = await Promise.all([
    this.getRoomList(ws),
    this.getSubscribedRoomList(ws)
  ]);
  const unreadMap = new Map(subscribedRooms.update.map((item: any) => [item.rid, item.unread]));
  const fnameMap = new Map(subscribedRooms.update.map((item: any) => [item.rid, item.fname]));

  this.messagesList = await Promise.all(
    roomList.update.map(async (room: any) => {
      const otherUsername = room.usernames?.find((str: any) => str !== currentUser.username) ?? 'default';
      const image = await this.resolveImageUrl(otherUsername);

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

  const hasUnread = this.messagesList.some((room: any) => room.unread > 0);
  this.chatService.initialBadge =hasUnread;
}

private async handleMessageChangeEvent(fields: any, currentUser:any) {
  const { eventName, args } = fields;
  if (eventName.includes('rooms-changed') && args[0] === 'updated') {
    const incomingMsgData = args[1];
    if (incomingMsgData.lastMessage) {
      const roomIndex = this.messagesList.findIndex(
        (obj: any) => obj._id === incomingMsgData.lastMessage.rid
      );

      if (roomIndex !== -1) {
        const room = this.messagesList[roomIndex];
        room.lastMessage = incomingMsgData.lastMessage;
        if(room.lastMessage.u._id != currentUser._id) {
          room.unread += 1;
        } else {
          room.unread = 0;
        }
       

        const [updatedRoom] = this.messagesList.splice(roomIndex, 1);

        this.messagesList.unshift(updatedRoom);
      } else {
        const subscribedRooms = await this.getSubscribedRoomList(this.ws!);
    
        const unreadMap = new Map(subscribedRooms.update.map((item: any) => [item.rid, item.unread]));

        incomingMsgData.unread = unreadMap.get(incomingMsgData._id);
      
        this.messagesList.unshift(incomingMsgData);
      }

      const hasUnreadMessages = this.messagesList.some(room => room.unread > 0);
      this.chatService.messageBadge(hasUnreadMessages);
    }
  }
}

  async getTextLimit(): Promise<number | null> {
    const httpOptions = {
      headers: new HttpHeaders(this.headers),
    };
    const methodId = '12';

    const payload = {
      message: JSON.stringify({
        msg: 'method',
        id: methodId,
        method: 'public-settings/get',
        params: [{ $date: 0 }],
      }),
    };
    try {
      const response: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}${urlConstants.API_URLS.MESSAGE_LIMIT}`, payload, httpOptions)
      );
      const parsedMessage = JSON.parse(response.message);
      const settings = parsedMessage?.result?.update;
      const messageLimitSetting = settings?.find((s: any) => s._id === 'Message_MaxAllowedSize');
      return messageLimitSetting?.value ?? null;
    } catch (error) {
      return null;
    }
  }

  async resolveImageUrl(username: string): Promise<string> {
    const imageUrl = `${this.baseUrl}/avatar/${username}`;
    const defaultImage = 'assets/prof-img/user.png';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(imageUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const contentType = response.headers.get('Content-Type') || response.headers.get('content-type');
      if (contentType?.includes('image/svg+xml')) {
        return defaultImage;
      }
      return imageUrl;
    } catch (error) {
      return defaultImage;
    }
  }
}
