import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeViewComponent } from './home-view/home-view.component';
import { HomeRoutingModule } from './home-routing.module';
import {
  MdListModule,
  MdButtonModule,
  MdCardModule,
} from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    HomeRoutingModule,
    MdListModule,
    MdButtonModule,
    MdCardModule
  ],
  declarations: [HomeViewComponent]
})
export class HomeModule { }
