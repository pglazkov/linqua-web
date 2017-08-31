import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  MdListModule,
  MdButtonModule,
  MdCardModule,
  MdIconModule,
  MdInputModule,
  MdDialogModule,
  MdMenuModule
} from '@angular/material';

import { HomeViewComponent } from './home-view/home-view.component';
import { HomeRoutingModule } from './home-routing.module';
import { EntryEditorDialogComponent } from './entry-editor-dialog/entry-editor-dialog.component';
import { ReactiveFormsModule } from '@angular/forms';
import { EntryItemComponent } from './home-view/entry-item/entry-item.component';
import { StorageModule } from 'shared';

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
    MdMenuModule,
    ReactiveFormsModule,
    StorageModule
  ],
  declarations: [
    HomeViewComponent,
    EntryEditorDialogComponent,
    EntryItemComponent
  ],
  entryComponents: [
    EntryEditorDialogComponent
  ]
})
export class HomeModule { }
