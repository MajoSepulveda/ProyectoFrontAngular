import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportsService } from 'src/app/services/reports.service';

import { ReportsComponent } from './reports.component';

describe('ReportsComponent', () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;
  const reportsServiceMock = {
    consulta: jasmine.createSpy('consulta'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsComponent],
      providers: [{ provide: ReportsService, useValue: reportsServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
