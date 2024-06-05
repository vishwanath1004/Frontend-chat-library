import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { urlConstants } from '../../constants/urlConstants';

@Injectable({
  providedIn: 'root'
})
export class RocketChatApiService {
  baseUrl: any;
  headers: any;

  constructor(private http: HttpClient) { }

  async setHeadersAndWebsocket(config: any, ws: any) {
    this.baseUrl = config.rocketChatBaseUrl
    this.headers = {
      'X-Auth-Token': config.user.xAuthToken,
      'X-User-Id': config.user.userId,
      // You can add more headers if needed
    };

    ws.onopen = (event: any) => {
      const connectionMessage = {
        "msg": "connect",
        "version": "1",
        "support": ["1", "pre2", "pre1"]
      }
      ws.send(JSON.stringify(connectionMessage));
      ws.send(JSON.stringify({ "msg": "method", "id": new Date().getTime().toString(), "method": "login", "params": [{ "resume": config.user.xAuthToken }] }))
      ws.send(JSON.stringify({ "msg": "sub", "id": new Date().getTime().toString(), "name": "meteor.loginServiceConfiguration", "params": [] }))
    };

    ws.onmessage = (event: any) => {
      if (JSON.parse(event.data).msg === 'ping') {
        const pongMessage = {
          msg: 'pong',
        };
        ws.send(JSON.stringify(pongMessage));
      }
    }
  }

  async getRoomList(ws: WebSocket): Promise<any> {
    const url = `${this.baseUrl}${urlConstants.API_URLS.GET_DIRECT_MESSAGES_LIST}`;
    const httpOptions = {
      headers: new HttpHeaders(this.headers)
    };

    return lastValueFrom(this.http.get(url, httpOptions));
  }

  async getCurrentUserDetails(): Promise<any> {
    const url = `${this.baseUrl}${urlConstants.API_URLS.GET_MY_PROFILE_DETAIL}`;
    const httpOptions = {
      headers: new HttpHeaders(this.headers)
    };

    return lastValueFrom(this.http.get(url, httpOptions));
  }

  async getUserInfoByUsername(username: string): Promise<any> {
    const url = `${this.baseUrl}${urlConstants.API_URLS.GET_USER_DETAILS_BY_USERNAME}${username}`;
    const httpOptions = {
      headers: new HttpHeaders(this.headers)
    };

    return lastValueFrom(this.http.get(url, httpOptions));
  }

  async getSubscribedRoomList(ws: WebSocket): Promise<any> {
    const url = `${this.baseUrl}${urlConstants.API_URLS.SUBSCRIPTION_GET}`;
    const httpOptions = {
      headers: new HttpHeaders(this.headers)
    };

    return lastValueFrom(this.http.get(url, httpOptions));
  }
}
