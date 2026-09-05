import { Routes } from '@angular/router';
import { Login } from './features/home1/login/login';
import { Layout } from './features/layout/layout';
import { Admin } from './features/admin/admin';
import { Agent } from './features/agent/agent';
import { Region } from './features/region/region';
import { Locaux } from './features/locaux/locaux';
import {
  authGuard,
  guestGuard,
  homeRedirectGuard,
  roleGuard,
} from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard],
  },
  {
    path: 'home',
    component: Layout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        canActivate: [homeRedirectGuard],
        pathMatch: 'full',
        component: Admin,
      },
      {
        path: 'admin',
        component: Admin,
        canActivate: [roleGuard(['admin'])],
      },
      {
        path: 'compteurs',
        component: Agent,
        canActivate: [roleGuard(['agent', 'admin'])],
      },
      {
        path: 'factures',
        component: Region,
        canActivate: [roleGuard(['chef_region', 'admin'])],
      },
      {
        path: 'locaux',
        component: Locaux,
        canActivate: [roleGuard(['chef_local', 'admin'])],
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
