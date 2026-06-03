import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { User } from '../../services/user';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];

  roles = ['ADMIN', 'AGENCY', 'DRIVER', 'SECURITY', 'USER'];

  searchText = '';
  roleFilter = 'ALL';

  isLoading = false;
  isSaving = false;
  isEditing = false;

  form = {
    id: null as number | null,
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'USER',
  };

  constructor(
    private userService: User,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  get totalUsers(): number {
    return this.users.length;
  }

  get adminUsers(): number {
    return this.users.filter((user) => user.role === 'ADMIN').length;
  }

  get agencyUsers(): number {
    return this.users.filter((user) => user.role === 'AGENCY').length;
  }

  get driverUsers(): number {
    return this.users.filter((user) => user.role === 'DRIVER').length;
  }

  loadUsers(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = [...data].reverse();
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load users', error);
        this.isLoading = false;
        alert('Failed to load users');
        this.cdr.detectChanges();
      },
    });
  }

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredUsers = this.users.filter((user) => {
      const matchesSearch =
        !search ||
        String(user.id).includes(search) ||
        String(user.fullName || '').toLowerCase().includes(search) ||
        String(user.email || '').toLowerCase().includes(search) ||
        String(user.phone || '').toLowerCase().includes(search);

      const matchesRole =
        this.roleFilter === 'ALL' || user.role === this.roleFilter;

      return matchesSearch && matchesRole;
    });

    this.cdr.detectChanges();
  }

  saveUser(): void {
    if (
      !this.form.fullName.trim() ||
      !this.form.email.trim() ||
      !this.form.phone.trim() ||
      !this.form.role
    ) {
      alert('Please fill all required fields');
      return;
    }

    if (!this.isEditing && !this.form.password.trim()) {
      alert('Password is required for new user');
      return;
    }

    const payload = {
      fullName: this.form.fullName.trim(),
      email: this.form.email.trim(),
      password: this.form.password.trim(),
      phone: this.form.phone.trim(),
      role: this.form.role,
    };

    this.isSaving = true;
    this.cdr.detectChanges();

    if (this.isEditing && this.form.id !== null) {
      this.userService.updateUser(this.form.id, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.resetForm();
          this.loadUsers();
        },
        error: (error) => {
          console.error('Failed to update user', error);
          this.isSaving = false;
          alert('Failed to update user');
          this.cdr.detectChanges();
        },
      });
    } else {
      this.userService.createUser(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.resetForm();
          this.loadUsers();
        },
        error: (error) => {
          console.error('Failed to create user', error);
          this.isSaving = false;
          alert('Failed to create user. Email may already exist.');
          this.cdr.detectChanges();
        },
      });
    }
  }

  editUser(user: any): void {
    this.isEditing = true;

    this.form = {
      id: user.id,
      fullName: user.fullName || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      role: user.role || 'USER',
    };

    this.cdr.detectChanges();
  }

  resetForm(): void {
    this.isEditing = false;
    this.isSaving = false;

    this.form = {
      id: null,
      fullName: '',
      email: '',
      password: '',
      phone: '',
      role: 'USER',
    };

    this.cdr.detectChanges();
  }
}