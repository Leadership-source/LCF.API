import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";

export const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalTeams,
      publishedTeams,
      totalEvents,
      publishedEvents,
      totalContacts,
      unreadContacts,
      totalNotifications,
      unreadNotifications,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.team.count(),
      prisma.team.count({ where: { status: "PUBLISHED" } }),
      prisma.event.count(),
      prisma.event.count({ where: { status: "PUBLISHED" } }),
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { isRead: false } }),
      prisma.notification.count(),
      prisma.notification.count({ where: { isRead: false } }),
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        users: { total: totalUsers },
        teams: { total: totalTeams, published: publishedTeams, unpublished: totalTeams - publishedTeams },
        events: { total: totalEvents, published: publishedEvents, unpublished: totalEvents - publishedEvents },
        contacts: { total: totalContacts, unread: unreadContacts },
        notifications: { total: totalNotifications, unread: unreadNotifications },
      },
    });
  } catch (error) {
    console.error("ADMIN STATS ERROR:", error);
    return res.status(500).json({ status: "error", message: "Failed to fetch admin stats." });
  }
};

export const getAdminDashboard = (req, res) => {
  const apiBase = process.env.API_BASE_URL || "";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LCF Admin Dashboard</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; color: #1a1a2e; min-height: 100vh; }
    header { background: #1a1a2e; color: #fff; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    header h1 { font-size: 1.4rem; letter-spacing: 0.5px; }
    #user-info { font-size: 0.85rem; opacity: 0.75; }
    #logout-btn { background: #e74c3c; color: #fff; border: none; padding: 0.4rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; margin-left: 1rem; }
    main { padding: 2rem; max-width: 1100px; margin: 0 auto; }
    #login-section { background: #fff; border-radius: 12px; padding: 2rem; max-width: 400px; margin: 4rem auto; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    #login-section h2 { margin-bottom: 1.5rem; color: #1a1a2e; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.4rem; color: #555; }
    input[type=email], input[type=password] { width: 100%; padding: 0.65rem 0.9rem; border: 1px solid #ddd; border-radius: 8px; font-size: 0.95rem; outline: none; transition: border 0.2s; }
    input:focus { border-color: #4a6cf7; }
    #login-btn { width: 100%; background: #4a6cf7; color: #fff; border: none; padding: 0.75rem; border-radius: 8px; font-size: 1rem; cursor: pointer; font-weight: 600; margin-top: 0.5rem; }
    #login-btn:hover { background: #3a5ce4; }
    #login-error { color: #e74c3c; font-size: 0.85rem; margin-top: 0.75rem; display: none; }
    #dashboard-section { display: none; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }
    .stat-card { background: #fff; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border-left: 4px solid #4a6cf7; }
    .stat-card.green { border-left-color: #27ae60; }
    .stat-card.orange { border-left-color: #f39c12; }
    .stat-card.red { border-left-color: #e74c3c; }
    .stat-card.purple { border-left-color: #9b59b6; }
    .stat-label { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 0.5rem; }
    .stat-value { font-size: 2rem; font-weight: 700; color: #1a1a2e; }
    .stat-sub { font-size: 0.78rem; color: #aaa; margin-top: 0.25rem; }
    h2.section-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; color: #1a1a2e; }
    #loading { text-align: center; padding: 3rem; color: #888; }
  </style>
</head>
<body>
  <header>
    <h1>LCF Admin Dashboard</h1>
    <div style="display:flex;align-items:center;gap:0.5rem">
      <span id="user-info"></span>
      <button id="logout-btn" style="display:none" onclick="logout()">Logout</button>
    </div>
  </header>

  <main>
    <!-- Login -->
    <section id="login-section">
      <h2>Admin Login</h2>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" placeholder="admin@example.com" />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" placeholder="••••••••" />
      </div>
      <button id="login-btn" onclick="doLogin()">Sign In</button>
      <p id="login-error"></p>
    </section>

    <!-- Dashboard -->
    <section id="dashboard-section">
      <div id="loading">Loading stats…</div>
      <div id="stats-content" style="display:none">
        <h2 class="section-title">Overview</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Users</div>
            <div class="stat-value" id="stat-users">—</div>
          </div>
          <div class="stat-card green">
            <div class="stat-label">Teams</div>
            <div class="stat-value" id="stat-teams">—</div>
            <div class="stat-sub" id="stat-teams-sub"></div>
          </div>
          <div class="stat-card orange">
            <div class="stat-label">Events</div>
            <div class="stat-value" id="stat-events">—</div>
            <div class="stat-sub" id="stat-events-sub"></div>
          </div>
          <div class="stat-card red">
            <div class="stat-label">Contact Messages</div>
            <div class="stat-value" id="stat-contacts">—</div>
            <div class="stat-sub" id="stat-contacts-sub"></div>
          </div>
          <div class="stat-card purple">
            <div class="stat-label">Notifications</div>
            <div class="stat-value" id="stat-notifs">—</div>
            <div class="stat-sub" id="stat-notifs-sub"></div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <script>
    let token = localStorage.getItem('lcf_admin_token');

    async function doLogin() {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const err = document.getElementById('login-error');
      err.style.display = 'none';
      document.getElementById('login-btn').textContent = 'Signing in…';
      try {
        const res = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        token = data.token;
        localStorage.setItem('lcf_admin_token', token);
        document.getElementById('user-info').textContent = data.user?.name || data.user?.email || '';
        showDashboard();
      } catch (e) {
        err.textContent = e.message;
        err.style.display = 'block';
        document.getElementById('login-btn').textContent = 'Sign In';
      }
    }

    function logout() {
      localStorage.removeItem('lcf_admin_token');
      token = null;
      document.getElementById('dashboard-section').style.display = 'none';
      document.getElementById('login-section').style.display = 'block';
      document.getElementById('logout-btn').style.display = 'none';
      document.getElementById('user-info').textContent = '';
      fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    }

    async function showDashboard() {
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('dashboard-section').style.display = 'block';
      document.getElementById('logout-btn').style.display = 'inline-block';
      try {
        const res = await fetch('/admin/stats', {
          headers: { 'Authorization': 'Bearer ' + token },
          credentials: 'include',
        });
        if (res.status === 401) { logout(); return; }
        const { data } = await res.json();
        document.getElementById('stat-users').textContent = data.users.total;
        document.getElementById('stat-teams').textContent = data.teams.total;
        document.getElementById('stat-teams-sub').textContent = data.teams.published + ' published · ' + data.teams.unpublished + ' unpublished';
        document.getElementById('stat-events').textContent = data.events.total;
        document.getElementById('stat-events-sub').textContent = data.events.published + ' published · ' + data.events.unpublished + ' unpublished';
        document.getElementById('stat-contacts').textContent = data.contacts.total;
        document.getElementById('stat-contacts-sub').textContent = data.contacts.unread + ' unread';
        document.getElementById('stat-notifs').textContent = data.notifications.total;
        document.getElementById('stat-notifs-sub').textContent = data.notifications.unread + ' unread';
        document.getElementById('loading').style.display = 'none';
        document.getElementById('stats-content').style.display = 'block';
      } catch (e) {
        document.getElementById('loading').textContent = 'Failed to load stats.';
      }
    }

    // Auto-login if token is stored
    if (token) {
      fetch('/auth/me', {
        headers: { 'Authorization': 'Bearer ' + token },
        credentials: 'include',
      }).then(r => r.json()).then(d => {
        if (d.user) {
          document.getElementById('user-info').textContent = d.user.name || d.user.email;
          showDashboard();
        } else {
          localStorage.removeItem('lcf_admin_token');
          token = null;
        }
      }).catch(() => {});
    }

    // Allow Enter key on login form
    document.getElementById('password').addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });
  </script>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html");
  return res.send(html);
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role = "USER" } = req.body;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(400).json({ error: "A user with that email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
      select: { id: true, name: true, email: true, role: true, createdAT: true },
    });

    return res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    console.error("CREATE USER ERROR:", error);
    return res.status(500).json({ error: "Failed to create user" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAT: true },
      orderBy: { createdAT: "asc" },
    });
    return res.status(200).json({ users });
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.user.delete({ where: { id } });
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    return res.status(500).json({ error: "Failed to delete user" });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["USER", "ADMIN", "SUPERADMIN"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (id === req.user.id) {
      return res.status(400).json({ error: "You cannot change your own role" });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return res.status(200).json({ message: "User role updated", user: updated });
  } catch (error) {
    console.error("UPDATE ROLE ERROR:", error);
    return res.status(500).json({ error: "Failed to update user role" });
  }
};
