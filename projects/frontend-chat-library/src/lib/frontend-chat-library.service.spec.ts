import { TestBed } from '@angular/core/testing';

import { FrontendChatLibraryService } from './frontend-chat-library.service';

describe('FrontendChatLibraryService', () => {
  let service: FrontendChatLibraryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FrontendChatLibraryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
