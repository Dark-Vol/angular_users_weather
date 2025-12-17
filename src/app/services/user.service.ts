import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { RandomUserResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = 'https://randomuser.me/api/?results=10';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<RandomUserResponse> {
    return this.http.get<RandomUserResponse>(this.apiUrl).pipe(
      catchError((error) => {
        console.error('Error fetching users:', error);
        return throwError(() => new Error('Failed to fetch users. Please try again later.'));
      })
    );
  }
}

