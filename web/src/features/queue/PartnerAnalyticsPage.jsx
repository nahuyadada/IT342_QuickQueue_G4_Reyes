import { useMemo } from 'react';
import { usePartner } from '../../shared/UserPortalLayout';
import './BusinessDashboardPage.css';

export default function PartnerAnalyticsPage() {
  const office = usePartner();

  const data = useMemo(() => ({
    dailyVolume: [
      { day: 'Mon', count: 42 }, { day: 'Tue', count: 58 }, { day: 'Wed', count: 35 },
      { day: 'Thu', count: 65 }, { day: 'Fri', count: 48 }, { day: 'Sat', count: 22 }, { day: 'Sun', count: 0 },
    ],
    avgServiceTime: '8.3 min',
    totalServedToday: 23,
    noShowRate: '12%',
    peakHour: '10:00 AM',
    avgWaitTime: '14.2 min',
    satisfactionRate: '94%',
    totalServedWeek: 270,
  }), []);

  const maxBar = Math.max(...data.dailyVolume.map(d => d.count), 1);

  if (!office) return null;

  return (
    <div className="bdash-root">
      {/* Stats */}
      <div className="bdash-analytics-stats">
        <div className="bdash-astat">
          <div className="bdash-astat-icon blue">📊</div>
          <div>
            <span className="bdash-astat-value">{data.totalServedToday}</span>
            <span className="bdash-astat-label">Served Today</span>
          </div>
        </div>
        <div className="bdash-astat">
          <div className="bdash-astat-icon green">⏱️</div>
          <div>
            <span className="bdash-astat-value">{data.avgServiceTime}</span>
            <span className="bdash-astat-label">Avg Service Time</span>
          </div>
        </div>
        <div className="bdash-astat">
          <div className="bdash-astat-icon amber">❌</div>
          <div>
            <span className="bdash-astat-value">{data.noShowRate}</span>
            <span className="bdash-astat-label">No-Show Rate</span>
          </div>
        </div>
        <div className="bdash-astat">
          <div className="bdash-astat-icon purple">🕐</div>
          <div>
            <span className="bdash-astat-value">{data.peakHour}</span>
            <span className="bdash-astat-label">Peak Hour</span>
          </div>
        </div>
      </div>

      {/* Additional stats row */}
      <div className="bdash-analytics-stats" style={{ marginBottom: '1.25rem' }}>
        <div className="bdash-astat">
          <div className="bdash-astat-icon blue">⏳</div>
          <div>
            <span className="bdash-astat-value">{data.avgWaitTime}</span>
            <span className="bdash-astat-label">Avg Wait Time</span>
          </div>
        </div>
        <div className="bdash-astat">
          <div className="bdash-astat-icon green">⭐</div>
          <div>
            <span className="bdash-astat-value">{data.satisfactionRate}</span>
            <span className="bdash-astat-label">Satisfaction</span>
          </div>
        </div>
        <div className="bdash-astat">
          <div className="bdash-astat-icon purple">📈</div>
          <div>
            <span className="bdash-astat-value">{data.totalServedWeek}</span>
            <span className="bdash-astat-label">This Week</span>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bdash-card bdash-chart-card">
        <h3>Daily Queue Volume</h3>
        <p className="bdash-card-sub">Number of customers served per day this week</p>
        <div className="bdash-bar-chart">
          {data.dailyVolume.map(d => (
            <div key={d.day} className="bdash-bar-col">
              <span className="bdash-bar-value">{d.count}</span>
              <div className="bdash-bar-track">
                <div className="bdash-bar-fill" style={{ height: `${(d.count / maxBar) * 100}%` }} />
              </div>
              <span className="bdash-bar-label">{d.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
