import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Agencies } from './agencies';

describe('Agencies', () => {
  let component: Agencies;
  let fixture: ComponentFixture<Agencies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Agencies],
    }).compileComponents();

    fixture = TestBed.createComponent(Agencies);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
