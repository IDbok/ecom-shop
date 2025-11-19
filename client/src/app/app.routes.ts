import { Routes } from '@angular/router';
import { Home } from '../features/home/home';
import { MemberList } from '../features/members/member-list/member-list';
import { MemberDetailed } from '../features/members/member-detailed/member-detailed';
import { Lists } from '../features/lists/lists';
import { Messages } from '../features/messages/messages';
import { authGuard } from '../core/guards/auth-guard';
import { TestErrors } from '../features/test-errors/test-errors';
import { NotFound } from '../shared/errors/not-found/not-found';
import { ServerError } from '../shared/errors/server-error/server-error';
import { MemberProfile } from '../features/members/member-profile/member-profile';
import { MemberPhotos } from '../features/members/member-photos/member-photos';
import { MemberMessages } from '../features/members/member-messages/member-messages';
import { memberResolver } from '../features/members/member-resolver';
import { preventUnsavedChangesGuard } from '../core/guards/prevent-unsaved-changes-guard';
import { ProductList } from '../features/products/product-list/product-list';
import { productResolver } from '../features/products/product-resolver';
import { ProductDetailed } from '../features/products/product-detailed/product-detailed';
import { ProductDescription } from '../features/products/product-description/product-description';
import { ProductCharacteristicsEdit } from '../features/products/product-characteristics-edit/product-characteristics-edit';
import { ProductPhotos } from '../features/products/product-photos/product-photos';

export const routes: Routes = [
    {path: '', component: Home},
    {
        path: '',
        runGuardsAndResolvers: 'always',
        canActivate: [authGuard],
        children: [            
            {path: 'members', component: MemberList},
            {
                path: 'members/:id', 
                resolve: { member: memberResolver },
                runGuardsAndResolvers: 'always',
                component: MemberDetailed,
                children:[
                    {path: '', redirectTo: 'profile', pathMatch: 'full'},
                    {path: 'profile', component: MemberProfile, title: 'Profile', 
                        canDeactivate: [preventUnsavedChangesGuard]},
                    {path: 'photos', component: MemberPhotos, title: 'Photos'},
                    {path: 'messages', component: MemberMessages, title: 'Messages'},
                ]
            },
            {path: 'lists', component: Lists},
            {path: 'messages', component: Messages},
        ]
    },
    {path: 'products', component: ProductList},
    {
        path: 'products/:id', 
        resolve: { product: productResolver },
        runGuardsAndResolvers: 'always',
        component: ProductDetailed,
        children: [
            {path: '', redirectTo: 'description', pathMatch: 'full'},
            {path: 'description', component: ProductDescription, title: 'Description'},
            {path: 'edit', component: ProductCharacteristicsEdit, title: 'Edit Product'},
            {path: 'photos', component: ProductPhotos, title: 'Product Photos'},
        ]
    },
    {path: 'errors', component: TestErrors},
    {path: 'server-error', component: ServerError},
    {path: '**', component: NotFound},
];
