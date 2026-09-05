import { Component } from '@angular/core';
import { Navbar } from './navbar/navbar';
import { Footer } from './footer/footer';
import { Jeu } from './jeu/jeu';

import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import {User} from '../../models/User';
@Component({
  selector: 'app-home',
  imports: [Navbar, Footer, Jeu],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  constructor(private authservice: AuthService,private router:Router) {}

users: User[] = [];
  ngOnInit(): void {
console.log('test lehne ntastiw fi  token ');
const token = localStorage.getItem("token");
console.log(token);

 this.authservice.getAllusers().subscribe({
    next: (data) => {
      this.users = data;
      console.log(this.users);
    },
    error: (err) => {
      console.error(err);
    }
  });
 

}
}
