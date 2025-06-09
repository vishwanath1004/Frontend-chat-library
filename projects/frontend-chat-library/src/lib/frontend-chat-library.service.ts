import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FrontendChatLibraryService {
  config: any;
  public showBadge = new Subject<boolean>();
  public initialBadge:boolean =false;


  constructor() {}

  
   setConfig(data: any) {
    this.config = data;
  }


  messageBadge(value: boolean) {
    this.showBadge.next(value);
  }
}
