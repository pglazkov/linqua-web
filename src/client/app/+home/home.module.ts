import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  MdListModule,
  MdButtonModule,
  MdCardModule,
  MdIconModule,
  MdInputModule,
  MdDialogModule
} from '@angular/material';

import { HomeViewComponent } from './home-view/home-view.component';
import { HomeRoutingModule } from './home-routing.module';
import { EntryEditorDialogComponent } from './entry-editor-dialog/entry-editor-dialog.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    HomeRoutingModule,
    MdListModule,
    MdButtonModule,
    MdCardModule,
    MdIconModule,
    MdInputModule,
    MdDialogModule,
    ReactiveFormsModule
  ],
  declarations: [
    HomeViewComponent,
    EntryEditorDialogComponent
  ],
  entryComponents: [
    EntryEditorDialogComponent
  ]
})
export class HomeModule { }
