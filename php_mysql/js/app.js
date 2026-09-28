/**
 * Exam Duty Management System - Global App Logic
 * File: js/app.js
 */

const App = {
  // Get stored logged-in user
  getUser() {
    try {
      const data = localStorage.getItem('exam_duty_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  // Store user
  setUser(user) {
    localStorage.setItem('exam_duty_user', JSON.stringify(user));
  },

  // Logout
  logout() {
    localStorage.removeItem('exam_duty_user');
    window.location.href = 'index.html';
  },

  // Auth guard on protected pages
  requireAuth(adminOnly = false) {
    const user = this.getUser();
    if (!user) {
      window.location.href = 'index.html';
      return null;
    }
    if (adminOnly && !user.isAdmin) {
      alert('Access denied: Administrator privileges required.');
      window.location.href = 'dashboard.html';
      return null;
    }
    return user;
  },

  // Render navigation links based on user role
  initNav() {
    const user = this.getUser();
    if (!user) return;

    // Update username displays
    document.querySelectorAll('.user-name-display').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.user-role-display').forEach(el => {
      el.textContent = user.isAdmin ? 'System Administrator' : `Staff (ID: ${user.resourceId})`;
    });

    const nav = document.getElementById('sidebarNav');
    if (!nav) return;

    const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';

    const links = [
      { name: 'Dashboard', url: 'dashboard.html', icon: '📊' },
      { 
        name: user.isAdmin ? 'Assign Duty' : 'Add Duty', 
        url: 'add-duty.html', 
        icon: '📝' 
      },
      { name: 'My Duties', url: 'my-duties.html', icon: '📋' }
    ];

    if (user.isAdmin) {
      links.push({ name: 'Add Employee', url: 'add-employee.html', icon: '👤' });
    }

    nav.innerHTML = links.map(link => `
      <a href="${link.url}" class="nav-link ${currentPath === link.url ? 'active' : ''}">
        <span>${link.icon}</span>
        <span>${link.name}</span>
      </a>
    `).join('');
  },

  // Show banner alert
  showAlert(containerId, message, type = 'error') {
    const c = document.getElementById(containerId);
    if (!c) return;
    c.innerHTML = `
      <div class="alert alert-${type}">
        <span>${type === 'error' ? '⚠️' : '✅'}</span>
        <span>${message}</span>
      </div>
    `;
  },

  // Clear alert
  clearAlert(containerId) {
    const c = document.getElementById(containerId);
    if (c) c.innerHTML = '';
  }
};

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.split('/').pop() !== 'index.html') {
    App.initNav();
  }
});
