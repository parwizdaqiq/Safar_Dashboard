import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { User } from '../../services/user';
import { AdminAuth } from '../../services/admin-auth';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  selectedUser: any = null;

  adminRoles = ['ADMIN', 'AGENCY', 'SECURITY', 'USER'];
  agencyRoles = ['DRIVER'];

  searchText = '';
  roleFilter = 'ALL';
  showUserModal = false;

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
    profilePhoto: '',
  };

  constructor(
    private userService: User,
    private authService: AdminAuth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.resetForm();
    this.loadUsers();
  }

  get currentUserId(): number | null {
    return this.authService.getUserId();
  }

  get isAgency(): boolean {
    return this.authService.isAgency();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get roles(): string[] {
    return this.isAgency ? this.agencyRoles : this.adminRoles;
  }

  get totalUsers(): number {
    return this.users.length;
  }

  get adminUsers(): number {
    return this.users.filter((user: any) => user.role === 'ADMIN').length;
  }

  get agencyUsers(): number {
    return this.users.filter((user: any) => user.role === 'AGENCY').length;
  }

  get driverUsers(): number {
    return this.users.filter((user: any) => user.role === 'DRIVER').length;
  }

  loadUsers(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    const request =
      this.isAgency && this.currentUserId
        ? this.userService.getAgencyDrivers(this.currentUserId)
        : this.userService.getAllUsers();

    request.subscribe({
      next: (data: any[]) => {
        this.users = [...data].reverse();
        this.applyFilters();
        this.selectedUser = this.filteredUsers[0] || null;

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Failed to load users', error);
        this.isLoading = false;
        alert('Failed to load users');
        this.cdr.detectChanges();
      },
    });
  }

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredUsers = this.users.filter((user: any) => {
      const matchesSearch =
        !search ||
        String(user.id || '').toLowerCase().includes(search) ||
        String(user.fullName || '').toLowerCase().includes(search) ||
        String(user.email || '').toLowerCase().includes(search) ||
        String(user.phone || '').toLowerCase().includes(search);

      const matchesRole =
        this.roleFilter === 'ALL' || user.role === this.roleFilter;

      return matchesSearch && matchesRole;
    });

    if (
      this.selectedUser &&
      !this.filteredUsers.some((user: any) => user.id === this.selectedUser.id)
    ) {
      this.selectedUser = this.filteredUsers[0] || null;
    }

    this.cdr.detectChanges();
  }

  selectUser(user: any): void {
    this.selectedUser = user;
  }

  openUserModal(): void {
    this.resetForm();
    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.resetForm();
  }

  onProfilePhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      this.form.profilePhoto = String(reader.result || '');
      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  getUserInitial(user: any): string {
    return String(user.fullName || user.email || 'U').charAt(0).toUpperCase();
  }

  getUserPhoto(user: any): string {
    return (
      user.profilePhoto ||
      user.profileImage ||
      user.avatar ||
      user.imageUrl ||
      ''
    );
  }

  saveUser(): void {
    if (this.isAgency) {
      this.form.role = 'DRIVER';
    }

    if (!this.roles.includes(this.form.role)) {
      alert('You are not allowed to create this user role');
      return;
    }

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

    if (this.isAgency && !this.currentUserId) {
      alert('Agency session not found. Please login again.');
      return;
    }

    const payload: any = {
      fullName: this.form.fullName.trim(),
      email: this.form.email.trim(),
      phone: this.form.phone.trim(),
      role: this.isAgency ? 'DRIVER' : this.form.role,
      agencyId: this.isAgency ? this.currentUserId : null,
      profilePhoto: this.form.profilePhoto,
    };

    if (this.form.password.trim()) {
      payload.password = this.form.password.trim();
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    const request =
      this.isEditing && this.form.id !== null
        ? this.userService.updateUser(this.form.id, payload)
        : this.userService.createUser(payload);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.closeUserModal();
        this.loadUsers();
      },
      error: (error: any) => {
        console.error('Failed to save user', error);
        this.isSaving = false;
        alert(
          this.isEditing
            ? 'Failed to update user'
            : 'Failed to create user. Email may already exist.'
        );
        this.cdr.detectChanges();
      },
    });
  }

  editUser(user: any): void {
    this.isEditing = true;

    this.form = {
      id: user.id,
      fullName: user.fullName || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      role: this.isAgency ? 'DRIVER' : user.role || 'USER',
      profilePhoto: this.getUserPhoto(user),
    };

    this.selectedUser = user;
    this.showUserModal = true;
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
      role: this.isAgency ? 'DRIVER' : 'USER',
      profilePhoto: '',
    };

    this.cdr.detectChanges();
  }
}