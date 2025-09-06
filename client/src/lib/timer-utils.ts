export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return "00:00:00";
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function calculateProgress(lastKilledAt: string | Date | null, respawnTimeHours: number): number {
  if (!lastKilledAt) return 0;
  
  const killTime = new Date(lastKilledAt).getTime();
  const respawnTime = killTime + (respawnTimeHours * 60 * 60 * 1000);
  const now = Date.now();
  const totalTime = respawnTimeHours * 60 * 60 * 1000;
  const elapsed = now - killTime;
  
  if (elapsed >= totalTime) return 100;
  
  return Math.min(100, (elapsed / totalTime) * 100);
}

export function getTimeUntilRespawn(lastKilledAt: string | Date | null, respawnTimeHours: number): number {
  if (!lastKilledAt) return 0;
  
  const killTime = new Date(lastKilledAt).getTime();
  const respawnTime = killTime + (respawnTimeHours * 60 * 60 * 1000);
  const timeLeft = respawnTime - Date.now();
  
  return Math.max(0, timeLeft);
}

export function getBossStatusColor(boss: { isAlive: boolean; lastKilledAt: string | Date | null; respawnTimeHours: number }): string {
  if (boss.isAlive) return "status-alive";
  
  const timeLeft = getTimeUntilRespawn(boss.lastKilledAt, boss.respawnTimeHours);
  
  if (timeLeft <= 0) return "status-alive"; // Should respawn
  if (timeLeft <= 10 * 60 * 1000) return "status-soon"; // Within 10 minutes
  
  return "status-dead";
}

export function formatRelativeTime(timestamp: string | Date): string {
  const now = new Date().getTime();
  const time = new Date(timestamp).getTime();
  const diff = now - time;
  
  const minutes = Math.floor(diff / (60 * 1000));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  
  return "Just now";
}
