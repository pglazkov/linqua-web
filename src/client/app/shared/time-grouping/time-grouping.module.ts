import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeGroupService } from './time-group.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: []
})
export class TimeGroupingModule {
  static forRoot() {
    return {
      ngModule: TimeGroupingModule,
      providers: [
        TimeGroupService
      ]
    };
  }
}
