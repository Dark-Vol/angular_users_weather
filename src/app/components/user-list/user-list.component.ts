import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { WeatherService } from '../../services/weather.service';
import { UserWithWeather } from '../../models/user.model';
import { WeatherData } from '../../models/weather.model';
import { from, delay, concatMap, map, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit, OnDestroy {
  users = signal<UserWithWeather[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private weatherService: WeatherService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const usersWithWeather: UserWithWeather[] = response.results.map((user) => ({
            ...user,
            weather: undefined
          }));

          this.users.set(usersWithWeather);

          // Fetch weather for each user with delay to avoid rate limiting
          const usersWithValidCoordinates = usersWithWeather
            .map((user, index) => ({
              user,
              index,
              latitude: parseFloat(user.location.coordinates.latitude),
              longitude: parseFloat(user.location.coordinates.longitude)
            }))
            .filter((item) => !isNaN(item.latitude) && !isNaN(item.longitude));

          if (usersWithValidCoordinates.length === 0) {
            this.loading.set(false);
            return;
          }

          // Fetch weather sequentially with delay to avoid rate limiting
          from(usersWithValidCoordinates)
            .pipe(
              concatMap((item, index) =>
                this.weatherService.getWeather(item.latitude, item.longitude).pipe(
                  delay(index * 200), // 200ms delay between requests
                  map((weather: WeatherData) => ({ weather, userIndex: item.index }))
                )
              ),
              takeUntil(this.destroy$)
            )
            .subscribe({
              next: ({ weather, userIndex }) => {
                const updatedUsers = [...this.users()];
                updatedUsers[userIndex] = { ...updatedUsers[userIndex], weather };
                this.users.set(updatedUsers);
              },
              error: (err) => {
                // Only log if component is still alive
                if (!this.destroy$.closed) {
                  console.error('Failed to load weather:', err);
                }
                // Continue even if weather fails for some users
              }
            });

          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load users. Please try again later.');
          this.loading.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  retry(): void {
    this.loadUsers();
  }
}

