import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontendChatLibraryComponent } from './frontend-chat-library.component';

describe('FrontendChatLibraryComponent', () => {
  let component: FrontendChatLibraryComponent;
  let fixture: ComponentFixture<FrontendChatLibraryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FrontendChatLibraryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FrontendChatLibraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
