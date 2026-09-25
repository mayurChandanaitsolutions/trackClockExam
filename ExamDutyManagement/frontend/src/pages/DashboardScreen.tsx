import React, { useEffect, useState } from 'react';
import { DesktopTopNav } from '../components/DesktopTopNav';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { MobileHeader } from '../components/MobileHeader';
import { StatCard } from '../components/StatCard';
import { MonthlyChart } from '../components/MonthlyChart';
import { RecentDutiesTable, RecentDutySummary } from '../components/RecentDutiesTable';
import {
  ClipboardCheck,
  CalendarCheck,
  GraduationCap,
  BookOpen,
  UserCheck,
} from 'lucide-react';
import dashboardService, { EmployeeDashboardData } from '../services/dashboard.service';
import authService from '../services/auth.service';

export const DashboardScreen: React.FC = () => {
  const user = authService.getStoredUser();
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || user?.resourceId === '17655');
  const filterResourceId = isAdmin ? 'ALL' : (user?.resourceId || '');
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const [dashboardData, setDashboardData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch fresh dashboard data whenever filterResourceId or selectedYear changes
  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const data = await dashboardService.getEmployeeDashboard(filterResourceId, selectedYear);
        if (isMounted) {
          setDashboardData(data);
        }
      } catch (err) {
        console.warn('Dashboard live fetch failed or offline, using fallback state', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();
    return () => {
      isMounted = false;
    };
  }, [filterResourceId, selectedYear]);

  // Derived statistics (Live from MSSQL)
  const isAll = filterResourceId === 'ALL';
  const totalDuties = isAll
    ? (dashboardData?.stats?.systemTotalDuties ?? dashboardData?.stats?.totalDuties ?? 0)
    : (dashboardData?.stats?.totalDuties ?? 0);
  const thisMonth = dashboardData?.stats?.thisMonth ?? 0;
  const examsCount = dashboardData?.stats?.exams ?? 0;
  const mocksCount = dashboardData?.stats?.mocks ?? 0;

  const displayName = isAdmin
    ? (isAll ? 'Administrator (System Overview)' : (dashboardData?.employee?.name || 'Staff Member'))
    : (user?.name || dashboardData?.employee?.name || 'Employee');
  const displayResourceId = isAdmin
    ? (isAll ? 'ADMIN' : (dashboardData?.employee?.resourceId || filterResourceId))
    : (user?.resourceId || dashboardData?.employee?.resourceId || '');

  const recentDuties: RecentDutySummary[] | undefined = dashboardData?.recentDuties;
  const monthlyChartData = dashboardData?.monthlyOverview;

  return (
    <div className="unified-dashboard-root animate-fade-in">
      {/* 1. DESKTOP VIEW (Visible on screens >= 1024px) */}
      <div className="desktop-layout-wrapper">
        {/* Desktop Top Header Bar */}
        <DesktopTopNav />

        {/* Desktop Content Row: Sidebar + Main Area */}
        <div className="desktop-main-row">
          {/* Left Royal Blue Sidebar */}
          <DesktopSidebar />

          {/* Main Dashboard Panel */}
          <main className="desktop-content-panel">
            {/* Blue Welcome Banner Card */}
            <div className="desktop-welcome-banner">
              <div className="welcome-banner-left">
                <div className="banner-title-row">
                  <span className="banner-greeting">Welcome Back,</span>
                  <h1 className="banner-name">{displayName}</h1>
                </div>

                <div className="banner-meta-row">
                  <div className="banner-resource-pill">
                    <UserCheck size={14} />
                    <span>ID: {displayResourceId}</span>
                  </div>
                  {isAdmin ? (
                    <span className="mobile-role-badge badge-admin">ADMIN</span>
                  ) : (
                    <span className="mobile-role-badge badge-staff">STAFF</span>
                  )}
                </div>
              </div>
            </div>

            {/* 4 Statistics Cards in ONE ROW */}
            <section className="desktop-stats-row" aria-label="Key Metrics">
              <StatCard
                title="TOTAL DUTIES"
                value={String(totalDuties)}
                subtext="All assigned duties"
                icon={<ClipboardCheck size={22} color="#2563EB" />}
                iconBg="#EFF6FF"
                titleColor="#2563EB"
              />
              <StatCard
                title="THIS MONTH"
                value={String(thisMonth)}
                subtext="Duties in current month"
                icon={<CalendarCheck size={22} color="#059669" />}
                iconBg="#ECFDF5"
                titleColor="#059669"
              />
              <StatCard
                title="EXAMS"
                value={String(examsCount)}
                subtext="Exam duties"
                icon={<GraduationCap size={22} color="#7C3AED" />}
                iconBg="#F5F3FF"
                titleColor="#7C3AED"
              />
              <StatCard
                title="MOCKS"
                value={String(mocksCount)}
                subtext="Mock duties"
                icon={<BookOpen size={22} color="#D97706" />}
                iconBg="#FFFBEB"
                titleColor="#D97706"
              />
            </section>

            {/* Monthly Duty Overview Card */}
            <section className="desktop-chart-section">
              <MonthlyChart
                data={monthlyChartData}
                selectedYear={selectedYear}
                availableYears={dashboardData?.availableYears}
                onYearChange={(yr) => setSelectedYear(yr)}
              />
            </section>

            {/* Recent Duties Table */}
            <section className="desktop-table-section">
              <RecentDutiesTable duties={recentDuties} />
            </section>

            {/* Desktop Footer */}
            <footer className="desktop-portal-footer">
              <span className="footer-copyright">
                &copy; 2026 Exam Duty Management. All rights reserved.
              </span>
              <span className="footer-credits">
                Chandana IT Solutions | Powered by Technology for a Better Tomorrow
              </span>
            </footer>
          </main>
        </div>
      </div>

      {/* 2. MOBILE VIEW (Visible on screens < 1024px) */}
      <div className="mobile-layout-wrapper">
        {/* Mobile Header with Top Bar and Blue Banner */}
        <MobileHeader />

        {/* Mobile Main Body */}
        <main className="mobile-content-body">
          {/* 2x2 Stat Cards Grid */}
          <section className="mobile-stats-grid" aria-label="Duty Statistics">
            <StatCard
              title="TOTAL DUTIES"
              value={String(totalDuties)}
              subtext="All assigned duties"
              icon={<ClipboardCheck size={20} color="#2563EB" />}
              iconBg="#EFF6FF"
              titleColor="#2563EB"
            />
            <StatCard
              title="THIS MONTH"
              value={String(thisMonth)}
              subtext="Duties in current month"
              icon={<CalendarCheck size={20} color="#059669" />}
              iconBg="#ECFDF5"
              titleColor="#059669"
            />
            <StatCard
              title="EXAMS"
              value={String(examsCount)}
              subtext="Exam duties"
              icon={<GraduationCap size={20} color="#7C3AED" />}
              iconBg="#F5F3FF"
              titleColor="#7C3AED"
            />
            <StatCard
              title="MOCKS"
              value={String(mocksCount)}
              subtext="Mock duties"
              icon={<BookOpen size={20} color="#D97706" />}
              iconBg="#FFFBEB"
              titleColor="#D97706"
            />
          </section>

          {/* Monthly Duty Overview */}
          <section className="mobile-chart-section">
            <MonthlyChart
              data={monthlyChartData}
              selectedYear={selectedYear}
              availableYears={dashboardData?.availableYears}
              onYearChange={(yr) => setSelectedYear(yr)}
            />
          </section>

          {/* Recent Duties Cards */}
          <section className="mobile-duties-section">
            <RecentDutiesTable duties={recentDuties} />
          </section>
        </main>
      </div>
    </div>
  );
};

export default DashboardScreen;
