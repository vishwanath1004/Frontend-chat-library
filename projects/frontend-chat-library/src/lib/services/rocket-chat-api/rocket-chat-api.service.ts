import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { urlConstants } from '../../constants/urlConstants';

@Injectable({
  providedIn: 'root',
})
export class RocketChatApiService {
  baseUrl: any;
  headers: any;

  constructor(private http: HttpClient) {}

  async setHeadersAndWebsocket(config: any, ws: any) {
    this.baseUrl = urlConstants.BASE_URL;
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
          params: [{ resume: config.xAuthToken}],
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
}
