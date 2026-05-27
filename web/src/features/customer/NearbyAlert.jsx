import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTickets } from '../../shared/services/queueService';

const POLL_INTERVAL_MS = 10000;
const NEAR_THRESHOLD = 2;

export default function NearbyAlert() {
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const lastAlertedRef = useRef({});

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.id;
    if (!userId) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    let stopped = false;

    const check = async () => {
      try {
        const tickets = await getMyTickets(userId);
        if (!Array.isArray(tickets) || stopped) return;

        for (const t of tickets) {
          if (t.status !== 'WAITING' && t.status !== 'SERVING') continue;
          const peopleAhead = Number(t.peopleAhead ?? 999);
          const isReady = t.status === 'SERVING' || peopleAhead <= NEAR_THRESHOLD;
          if (!isReady) continue;

          const key = `${t.ticketId}-${t.status}-${peopleAhead}`;
          if (lastAlertedRef.current[t.ticketId] === key) continue;
          lastAlertedRef.current[t.ticketId] = key;

          const isServing = t.status === 'SERVING';
          const message = isServing
            ? "It's your turn now!"
            : peopleAhead === 0
              ? 'You are next in line!'
              : `Only ${peopleAhead} ${peopleAhead === 1 ? 'person' : 'people'} ahead of you.`;

          setAlert({
            ticket: t,
            isServing,
            message,
          });

          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(
                isServing ? `Now serving — ${t.officeName}` : `Your turn is coming up at ${t.officeName}`,
                { body: message }
              );
            } catch { /* ignore */ }
          }

          break;
        }
      } catch { /* ignore */ }
    };

    check();
    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => { stopped = true; clearInterval(interval); };
  }, []);

  if (!alert) return null;

  const goToQueues = () => {
    setAlert(null);
    navigate('/dashboard/queues');
  };

  return (
    <div className="nearby-alert-backdrop" onClick={() => setAlert(null)}>
      <div className="nearby-alert-card" onClick={(e) => e.stopPropagation()}>
        <div className="nearby-alert-icon">{alert.isServing ? '🛎️' : '⏰'}</div>
        <h3>{alert.isServing ? "It's Your Turn!" : 'Your Turn is Coming Up'}</h3>
        <p className="nearby-alert-name">{alert.ticket.officeName}</p>
        <p className="nearby-alert-ticket">Ticket #{alert.ticket.ticketNumber}</p>
        <p className="nearby-alert-dist">{alert.message}</p>
        <div className="nearby-alert-actions">
          <button type="button" className="nearby-alert-btn primary" onClick={goToQueues}>
            View My Queue
          </button>
          <button type="button" className="nearby-alert-btn" onClick={() => setAlert(null)}>
            Dismiss
          </button>
        </div>
      </div>
      <style>{`
        .nearby-alert-backdrop {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; animation: nearbyFadeIn 0.18s ease-out;
        }
        .nearby-alert-card {
          background: #fff; border-radius: 16px; padding: 28px 28px 22px;
          max-width: 380px; width: calc(100% - 32px); text-align: center;
          box-shadow: 0 25px 60px rgba(0,0,0,0.35);
          animation: nearbyPop 0.22s ease-out;
        }
        .nearby-alert-icon { font-size: 44px; margin-bottom: 8px; }
        .nearby-alert-card h3 { margin: 0 0 8px; font-size: 20px; color: #1e3a8a; }
        .nearby-alert-name { font-size: 17px; font-weight: 600; color: #0f172a; margin: 4px 0; }
        .nearby-alert-ticket { color: #64748b; font-size: 13px; margin: 0 0 6px; font-family: monospace; }
        .nearby-alert-dist { color: #2563eb; font-weight: 600; margin: 6px 0 18px; }
        .nearby-alert-actions { display: flex; flex-direction: column; gap: 8px; }
        .nearby-alert-btn {
          padding: 11px 16px; border-radius: 10px; border: 1px solid #e2e8f0;
          background: #fff; color: #334155; font-weight: 600; cursor: pointer;
          font-size: 14px; transition: all 0.15s;
        }
        .nearby-alert-btn:hover { background: #f8fafc; }
        .nearby-alert-btn.primary {
          background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; border-color: transparent;
        }
        .nearby-alert-btn.primary:hover { background: linear-gradient(135deg, #1d4ed8, #1e40af); }
        @keyframes nearbyFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes nearbyPop {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
