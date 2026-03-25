import { useEffect, useRef } from 'react';
import { useAppointments } from '../context/AppointmentContext';
import { useNotification } from '../context/NotificationContext';
import { useRole } from '../context/RoleContext';
import { format, isAfter, isBefore, addHours, addMinutes } from 'date-fns';

export function AppointmentReminder() {
  const { appointments } = useAppointments();
  const { addNotification } = useNotification();
  const { role, isAuthenticated } = useRole();
  const notifiedAppointments = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated || !appointments.length) return;

    const checkReminders = () => {
      const now = new Date();
      const reminderWindow = addHours(now, 24); // Check for appointments in the next 24 hours

      appointments.forEach(apt => {
        if (apt.status !== 'scheduled' && apt.status !== 'confirmed') return;
        
        const aptDate = new Date(apt.date);
        
        // If appointment is in the next 24 hours and we haven't notified yet
        if (isAfter(aptDate, now) && isBefore(aptDate, reminderWindow)) {
          
          // Specific reminder for 1 hour before
          const oneHourBefore = addMinutes(now, 60);
          const isVerySoon = isBefore(aptDate, oneHourBefore);
          
          const reminderKey = `${apt.id}-${isVerySoon ? 'soon' : 'upcoming'}`;

          if (!notifiedAppointments.current.has(reminderKey)) {
            const timeStr = format(aptDate, 'HH:mm');
            const dateStr = format(aptDate, 'dd/MM/yyyy');
            
            const title = isVerySoon ? '⚠️ Cita Inminente' : '📅 Recordatorio de Cita';
            const message = isVerySoon 
              ? `La cita con ${apt.patientName} es en menos de una hora (${timeStr}).`
              : `Recordatorio: Cita con ${apt.patientName} mañana a las ${timeStr}.`;

            addNotification(title, message, isVerySoon ? 'warning' : 'info');
            
            // Also try browser notification if permitted
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(title, { body: message });
            }

            notifiedAppointments.current.add(reminderKey);
          }
        }
      });
    };

    // Check immediately and then every 5 minutes
    checkReminders();
    const interval = setInterval(checkReminders, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [appointments, isAuthenticated, addNotification]);

  return null; // This component doesn't render anything
}
