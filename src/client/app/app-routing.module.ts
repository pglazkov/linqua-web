import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared';

const routes: Routes = [
  { path: '', loadChildren: './+home/home.module#HomeModule', canActivate: [AuthGuard] },
  { path: 'login', loadChildren: './+login/login.module#LoginModule' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
