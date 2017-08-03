import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeViewComponent } from './home-view/home-view.component';
import { HomeRoutingModule } from './home-routing.module';
import {
  MdListModule,
  MdButtonModule,
  MdCardModule,
  MdIconModule,
  MdInputModule
} from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    HomeRoutingModule,
    MdListModule,
    MdButtonModule,
    MdCardModule,
    MdIconModule,
    MdInputModule
  ],
  declarations: [HomeViewComponent]
})
export class HomeModule { }
