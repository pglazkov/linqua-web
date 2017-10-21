import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  MatListModule,
  MatButtonModule,
  MatCardModule,
  MatIconModule,
  MatInputModule,
  MatDialogModule,
  MatMenuModule,
  MatProgressSpinnerModule
} from '@angular/material';

import { HomeViewComponent } from './home-view/home-view.component';
import { HomeRoutingModule } from './home-routing.module';
import { EntryEditorDialogComponent } from './entry-editor-dialog/entry-editor-dialog.component';
import { ReactiveFormsModule } from '@angular/forms';
import { EntryItemComponent } from './home-view/entry-item/entry-item.component';
import { StorageModule, TranslationModule } from 'shared';

@NgModule({
  imports: [
    CommonModule,
    HomeRoutingModule,
    MatListModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatDialogModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    StorageModule,
    TranslationModule
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
