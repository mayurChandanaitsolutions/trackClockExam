import React, { useEffect, useState, useMemo } from 'react';
import { DesktopTopNav } from '../../components/DesktopTopNav';
import { DesktopSidebar } from '../../components/DesktopSidebar';
import { MobileHeader } from '../../components/MobileHeader';
import { StatCard } from '../../components/StatCard';
import { MonthlyChart } from '../../components/MonthlyChart';
import { RecentDutiesTable, RecentDutySummary } from '../../components/RecentDutiesTable';
import {
  ClipboardCheck,
  CalendarCheck,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import dashboardService, { EmployeeDashboardData } from '../../services/dashboard.service';
import dutyService, { DutyItem } from '../../services/duty.service';

export const AdminDashboardScreen: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [dashboardData, setDashboardData] = useState<EmployeeDashboardData | null>(null);
  const [dutiesList, setDutiesList] = useState<DutyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [data, backendDuties] = await Promise.all([
          dashboardService.getEmployeeDashboard('ALL', selectedYear).catch(() => null),
          dutyService.getMyDuties(undefined, undefined, 'ALL').catch(() => []),
        ]);

        let localItems: DutyItem[] = [];
        try {
          const raw = localStorage.getItem('cached_assigned_duties');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              localItems = parsed;
            }
          }
        } catch (e) {
          console.error('Failed to read local cached duties', e);
        }

        const combined = [...(backendDuties || [])];
        for (const loc of localItems) {
          const exists = combined.some(
            (b) =>
              b.id === loc.id ||
              (b.dutyDate === loc.dutyDate &&
                (b.centerId === loc.centerId || b.center?.centerName === loc.center?.centerName) &&
                (b.shiftId === loc.shiftId || b.shift?.name === loc.shift?.name) &&
                (b.employee?.resourceId === loc.employee?.resourceId || b.employeeId === loc.employeeId))
          );
          if (!exists) {
            combined.push(loc);
          }
        }

        if (isMounted) {
          if (data) setDashboardData(data);
          setDutiesList(combined);
        }
      } catch (err) {
        console.warn('Admin dashboard fetch failed, using fallback', err);
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
  }, [selectedYear]);

  const totalDuties = dutiesList.length > 0
    ? dutiesList.length
    : (dashboardData?.stats?.systemTotalDuties ?? dashboardData?.stats?.totalDuties ?? 0);

  const mocksCount = dutiesList.length > 0
    ? dutiesList.filter((d) => (d.dutyType || d.exam?.type || '').toLowerCase().includes('mock')).length
    : (dashboardData?.stats?.mocks ?? 0);

  const examsCount = dutiesList.length > 0
    ? (totalDuties - mocksCount)
    : (dashboardData?.stats?.exams ?? 0);

  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const currentYear = now.getFullYear();
  const thisMonth = dutiesList.length > 0
    ? dutiesList.filter((d) => {
        const str = (d.dutyDate || '').trim();
        const ymd = str.match(/^(\d{4})[-/](\d{1,2})/);
        if (ymd) {
          return parseInt(ymd[1], 10) === currentYear && parseInt(ymd[2], 10) - 1 === currentMonthIndex;
        }
        return true;
      }).length
    : (dashboardData?.stats?.thisMonth ?? 0);

  const recentDuties: RecentDutySummary[] = dutiesList.length > 0
    ? dutiesList.slice(0, 5).map((d, index) => ({
        num: index + 1,
        id: d.id,
        exam: d.exam?.name || d.dutyType || 'Exam',
        date: d.dutyDate,
        center: d.center?.centerName || 'Assigned Center',
        city: d.city?.name || 'Assigned City',
        role: d.role?.name || 'Invigilator',
        shift: d.shift?.name || 'Shift 1',
        status: d.status || 'Pending',
        reportingTime: d.reportingTime,
        shiftEndTime: d.shiftEndTime,
        employeeName: d.employee?.name || 'Assigned Staff',
        resourceId: d.employee?.resourceId || d.employeeId,
      }))
    : (dashboardData?.recentDuties || []);

  const monthlyChartData = useMemo(() => {
    if (dutiesList.length === 0 && dashboardData?.monthlyOverview) {
      return dashboardData.monthlyOverview;
    }
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const cMonthIdx = new Date().getMonth();
    const months = monthNames.map((name, i) => {
      let exams = 0;
      let mocks = 0;
      dutiesList.forEach((d) => {
        const str = (d.dutyDate || '').trim();
        const m = str.match(/^(\d{4})[-/](\d{1,2})/);
        if (m) {
          const dYear = parseInt(m[1], 10);
          const dMonth = parseInt(m[2], 10) - 1;
          if (dYear === selectedYear && dMonth === i) {
            const isMock = (d.dutyType || d.exam?.type || '').toLowerCase().includes('mock');
            if (isMock) mocks++;
            else exams++;
          }
        } else if (i === cMonthIdx) {
          const isMock = (d.dutyType || d.exam?.type || '').toLowerCase().includes('mock');
          if (isMock) mocks++;
          else exams++;
        }
      });
      return { month: name, exams, mocks, total: exams + mocks, isCurrent: i === cMonthIdx };
    });
    return months;
  }, [dutiesList, dashboardData, selectedYear]);

  return (
    <div className="unified-dashboard-root animate-fade-in">
      {/* Desktop View */}
      <div className="desktop-layout-wrapper">
        <DesktopTopNav />
        <div className="desktop-main-row">
          <DesktopSidebar />
          <main className="desktop-content-panel">
            <div className="page-section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="page-header-icon-box">
                  <ClipboardCheck size={24} color="#2563EB" />
                </div>
                <div>
                  <h1 className="page-main-heading">Admin Dashboard</h1>
                  <p className="page-sub-heading">System Overview &amp; Examination Operations</p>
                </div>
              </div>
            </div>

            {/* 4 Key Metrics */}
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
                subtext="Exam duties per day"
                icon={<GraduationCap size={22} color="#7C3AED" />}
                iconBg="#F5F3FF"
                titleColor="#7C3AED"
              />
              <StatCard
                title="MOCKS"
                value={String(mocksCount)}
                subtext="Mock duties per day"
                icon={<BookOpen size={22} color="#D97706" />}
                iconBg="#FFFBEB"
                titleColor="#D97706"
              />
            </section>

            {/* Monthly Duty Overview */}
            <section className="desktop-chart-card">
              <MonthlyChart
                data={monthlyChartData}
                selectedYear={selectedYear}
                onYearChange={(yr) => setSelectedYear(yr)}
              />
            </section>

            {/* Recent Duties Table */}
            <section className="desktop-recent-section">
              <RecentDutiesTable duties={recentDuties} />
            </section>
          </main>
        </div>
      </div>

      {/* Mobile View */}
      <div className="mobile-layout-wrapper">
        <MobileHeader />
        <main className="mobile-content-body">
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
              subtext="Exam duties per day"
              icon={<GraduationCap size={20} color="#7C3AED" />}
              iconBg="#F5F3FF"
              titleColor="#7C3AED"
            />
            <StatCard
              title="MOCKS"
              value={String(mocksCount)}
              subtext="Mock duties per day"
              icon={<BookOpen size={20} color="#D97706" />}
              iconBg="#FFFBEB"
              titleColor="#D97706"
            />
          </section>

          <section className="mobile-chart-section">
            <MonthlyChart
              data={monthlyChartData}
              selectedYear={selectedYear}
              onYearChange={(yr) => setSelectedYear(yr)}
            />
          </section>

          <section className="mobile-recent-section">
            <RecentDutiesTable duties={recentDuties} />
          </section>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardScreen;
