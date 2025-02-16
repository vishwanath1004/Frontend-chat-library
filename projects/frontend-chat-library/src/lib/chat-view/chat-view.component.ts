import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
} from '@angular/core';
import { RocketChatApiService } from '../services/rocket-chat-api/rocket-chat-api.service';
import { urlConstants } from '../constants/urlConstants';
import { FrontendChatLibraryService } from '../frontend-chat-library.service';

@Component({
  selector: 'lib-chat-view',
  templateUrl: './chat-view.component.html',
  styleUrls: ['./chat-view.component.css'],
})
export class ChatViewComponent implements OnInit {
  history: any;
  @Input() config: any;
  @Input() rid: any;
  @Output() backEvent = new EventEmitter();
  @Output() profileEvent= new EventEmitter();

  currentUser: any;
  ws: any;
  messages: any = [];
  messageText: string = '';
  roomDetails: any;
  friendDetails: any;
  @ViewChild('messageBody', { static: false }) messageBody!: ElementRef;
  private lastTimestamp: Date | null = null;
  private isLoadingHistory = false;
  private allMessagesLoaded = false;
  constructor(
    private rocketChatApi: RocketChatApiService,
    private chatService: FrontendChatLibraryService,
    private cdk: ChangeDetectorRef
  ) {}

  ionviewWillEnter() {}
  async ngOnInit() {
    this.config = this.config || this.chatService.config;
    if (!this.rid) {
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
    this.friendDetails.profilePic =
      urlConstants.BASE_URL + '/avatar/' + this.friendDetails.user.username;
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
          this.messages = [...this.messages.reverse()];
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
      setTimeout(() => this.initializeWebSocket(), 5000);
    };
  }

  async loadChatHistory() {
    if (this.isLoadingHistory || this.allMessagesLoaded) {
      return;
    }

    this.isLoadingHistory = true;

    try {
      const response = await this.rocketChatApi.getChatHistory(this.ws, {
        url: urlConstants.API_URLS.LOAD_HISTORY,
        payload: {
          message: JSON.stringify({
            msg: 'method',
            method: 'loadHistory',
            id: '' + new Date().getTime(),
            params: [this.rid, this.lastTimestamp, 60, null],
          }),
        },
      });

      if (!response) {
        console.error('Failed to load chat history');
        this.isLoadingHistory = false;
        return;
      }

      const rawMessages: any = JSON.parse(response.message);
      if (!Array.isArray(rawMessages.result.messages)) {
        console.error('Messages is not an array');
        this.isLoadingHistory = false;
        return;
      }

      const newMessages = rawMessages.result.messages;

      if (newMessages.length === 0) {
        this.allMessagesLoaded = true;
      } else {
        this.lastTimestamp = new Date(
          newMessages[newMessages.length - 1].ts.$date
        );
        const groupedMessages = this.groupMessagesByDate(newMessages);

        this.messages = [...groupedMessages, ...this.messages];
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      this.isLoadingHistory = false;
    }
  }

  onScroll(event: any) {
    if (event.target.scrollTop === 0 && !this.isLoadingHistory) {
      this.loadChatHistory();
    }
  }

  addNewMessage(message: any) {
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

  goBack() {
    this.backEvent.emit();
  }

  profile(){
    this.profileEvent.emit();
  }
}
