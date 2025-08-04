import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home').then(c => c.Home)},
  { path: 'category', loadComponent: () => import('./features/category/category-container').then(c => c.CategoryContainer )}
];
