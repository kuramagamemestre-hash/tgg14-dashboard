import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Boss } from "@shared/schema";

// Função para tocar som de alerta
const playAlertSound = () => {
  // Criar um beep usando Web Audio API
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800; // Frequência do beep
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};

export function useNotifications() {
  const [notificationCount, setNotificationCount] = useState(0);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [alertedBosses, setAlertedBosses] = useState<Set<string>>(new Set());

  const { data: bosses = [] } = useQuery<Boss[]>({
    queryKey: ["/api/bosses"],
  });

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        setHasNotificationPermission(permission === "granted");
      });
    } else {
      setHasNotificationPermission(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    if (!bosses.length) return;

    const checkNotifications = () => {
      let count = 0;
      
      bosses.forEach((boss) => {
        if (!boss.isAlive && boss.lastKilledAt) {
          const killTime = new Date(boss.lastKilledAt).getTime();
          const respawnTime = killTime + (boss.respawnTimeHours * 60 * 60 * 1000);
          const timeLeft = respawnTime - Date.now();
          
          // Notify if spawning within 10 minutes
          if (timeLeft > 0 && timeLeft <= 10 * 60 * 1000) {
            count++;
            
            // Play sound alert when 5 minutes remaining (only once per boss)
            if (timeLeft <= 5 * 60 * 1000 && timeLeft > 4.5 * 60 * 1000 && !alertedBosses.has(boss.id)) {
              playAlertSound();
              setAlertedBosses(prev => new Set([...Array.from(prev), boss.id]));
            }
            
            // Send browser notification for imminent spawns (within 2 minutes)
            if (hasNotificationPermission && timeLeft <= 2 * 60 * 1000) {
              const minutes = Math.ceil(timeLeft / (60 * 1000));
              new Notification(`${boss.name} Spawning Soon!`, {
                body: `${boss.name} will respawn in ${minutes} minute${minutes === 1 ? '' : 's'}`,
                icon: "/favicon.ico",
                tag: `boss-${boss.id}`, // Prevent duplicate notifications
              });
            }
          } else if (timeLeft <= 0) {
            // Reset alert for this boss when it respawns
            setAlertedBosses(prev => {
              const newSet = new Set(prev);
              newSet.delete(boss.id);
              return newSet;
            });
          }
        }
      });
      
      setNotificationCount(count);
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [bosses, hasNotificationPermission]);

  return { notificationCount, hasNotificationPermission };
}
