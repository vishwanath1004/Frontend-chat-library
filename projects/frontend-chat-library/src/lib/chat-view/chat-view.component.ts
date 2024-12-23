import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { RocketChatApiService } from '../services/rocket-chat-api/rocket-chat-api.service';
import { urlConstants } from '../constants/urlConstants';
import { FrontendChatLibraryService } from '../frontend-chat-library.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'lib-chat-view',
  templateUrl: './chat-view.component.html',
  styleUrls: ['./chat-view.component.css'],
})
export class ChatViewComponent implements OnInit {
  history: any;
  @Input() config: any;
  currentUser: any;
  ws: any;
  rid: string | undefined;
  messages: any = [];
  messageText: string = '';
  roomDetails: any;
  friendDetails: any;
  @ViewChild('messageBody', { static: false }) messageBody!: ElementRef;
  constructor(
    private rocketChatApi: RocketChatApiService,
    private chatService: FrontendChatLibraryService,
    private routerParams: ActivatedRoute,
    private cdk: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.routerParams.queryParams.subscribe((params: any) => {
      console.log(params, 'params');
      this.rid = params.rid;
    });
    this.config = this.config || this.chatService.config;
    if (!this.rid) {
      console.error('Room ID (rid) is required');
      return;
    }
    await this.initializeWebSocket();
    this.loadChatHistory();
  }

  async initializeWebSocket() {
    this.ws = new WebSocket(urlConstants.websocketUrl);
    await this.rocketChatApi.setHeadersAndWebsocket(this.config, this.ws);
    this.currentUser = await this.rocketChatApi.getCurrentUserDetails();
    this.roomDetails = await this.rocketChatApi.getRoomInfo(this.rid);
    console.log(this.roomDetails, 'roomDetails');
    await this.rocketChatApi.subscribeToRoomChat(
      this.config,
      this.ws,
      this.rid,
      this.roomDetails.room._id
    );

    let friendName = await this.roomDetails?.room?.usernames.find(
      (name: any) => name !== this.currentUser.username
    );

    this.friendDetails = await this.rocketChatApi.getUserInfoByUsername(
      friendName
    );
    this.ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.msg === 'ping') {
        const pongMessage = {
          msg: 'pong',
        };
        this.ws.send(JSON.stringify(pongMessage));
      }
      if (
        data.msg === 'changed' &&
        data.collection === 'stream-room-messages'
      ) {
        const newMessage = data.fields.args[0];
        if (newMessage && newMessage.rid === this.rid) {
          const formattedMessage = {
            author: this.currentUser._id === newMessage.u._id ? true : false,
            content: newMessage.msg,
            time: new Date(newMessage.ts.$date).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            image: urlConstants.BASE_URL + '/avatar/' + newMessage.u.username,
          };
          const date = new Date(newMessage.ts.$date).toLocaleDateString();
          const group = this.messages.find((m: any) => m.date === date);
          if (group) {
            group.messages.push(formattedMessage);
          } else {
            this.messages.push({
              date,
              messages: [formattedMessage],
            });
          }
          this.messages = [...this.messages.reverse()];
          this.cdk.detectChanges();
        }
      }
    };

    this.ws.onerror = (error: any) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      setTimeout(() => this.initializeWebSocket(), 5000); // Reconnect after 5 seconds
    };
  }

  async loadChatHistory() {
    this.history = await this.rocketChatApi.getChatHistory(this.ws, {
      url: urlConstants.API_URLS.LOAD_HISTORY,
      payload: {
        message: JSON.stringify({
          msg: 'method',
          method: 'loadHistory',
          id: '' + new Date().getTime(),
          params: [this.rid, null, 60, null],
        }),
      },
    });

    if (!this.history) {
      console.error('Failed to load chat history');
      return;
    }

    const rawMessages: any = JSON.parse(this.history.message);
    if (!Array.isArray(rawMessages.result.messages)) {
      console.error('Messages is not an array');
      return;
    }
    this.messages = this.groupMessagesByDate(rawMessages.result.messages);
    this.messages = this.messages.reverse();
  }

  addNewMessage(message: any) {
    console.log(message, 'message message');
    const date = new Date(message.ts).toLocaleDateString();
    const formattedMessage = {
      author: this.currentUser._id === message.u._id ? true : false,
      content: message.content,
      time: new Date(message.ts).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const group = this.messages.find((m: any) => m.date === date);
    if (group) {
      group.messages.push(formattedMessage);
    } else {
      this.messages.push({
        date,
        messages: [formattedMessage],
      });
    }

    // Force Angular change detection
    this.messages = [...this.messages];
  }

  groupMessagesByDate(messages: any[]) {
    const grouped: any = messages.reduce((acc, message) => {
      const date = new Date(message.ts.$date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push({
        author: this.currentUser._id === message.u._id ? true : false,
        image: urlConstants.BASE_URL + '/avatar/' + message.u.username,
        content: message.msg,
        time: new Date(message.ts.$date).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, msgs]) => ({
      date,
      messages: msgs,
    }));
  }

  async sendMessage() {
    if (!this.messageText.trim()) {
      return;
    }

    const payload = {
      msg: 'method',
      method: 'sendMessage',
      id: '' + new Date().getTime(),
      params: [
        {
          rid: this.rid,
          msg: this.messageText,
        },
      ],
    };

    this.ws?.send(JSON.stringify(payload));
    this.scrollToBottom();
    this.messageText = '';
  }
  trackByDate(index: number, item: any): string {
    return item.date;
  }

  scrollToBottom() {
    if (this.messageBody) {
      setTimeout(() => {
        this.messageBody.nativeElement.scroll({
          top: this.messageBody.nativeElement.scrollHeight,
          behavior: 'smooth',
        });
      }, 0);
    }
  }
}
