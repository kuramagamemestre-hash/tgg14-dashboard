import { useState, useEffect } from "react";
import { Boss } from "@shared/schema";
import {
  formatTimeRemaining,
  calculateProgress,
  getTimeUntilRespawn,
  getBossStatusColor,
} from "@/lib/timer-utils";
import { cn } from "@/lib/utils";
import { Snail, Skull, Leaf, Crown, Shield, Flame, RotateCcw } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface BossTimerProps {
  boss: Boss;
  className?: string;
  onRevive?: (bossId: string) => void;
}

const iconMap = {
  dragon: Snail,
  skull: Skull,
  leaf: Leaf,
  crown: Crown,
  shield: Shield,
  flame: Flame,
};

const colorMap = {
  red: "bg-red-600",
  purple: "bg-purple-600",
  green: "bg-green-600",
  blue: "bg-blue-600",
  yellow: "bg-yellow-600",
  orange: "bg-orange-600",
};

export default function BossTimer({ boss, className, onRevive }: BossTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!boss.isAlive && boss.lastKilledAt) {
      const updateTimer = () => {
        const remaining = getTimeUntilRespawn(boss.lastKilledAt, boss.respawnTimeHours);
        const prog = calculateProgress(boss.lastKilledAt, boss.respawnTimeHours);

        setTimeLeft(remaining);
        setProgress(prog);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(0);
      setProgress(0);
    }
  }, [boss.isAlive, boss.lastKilledAt, boss.respawnTimeHours]);

  const Icon = iconMap[boss.iconType as keyof typeof iconMap] || Snail;
  const iconColorClass =
    colorMap[boss.iconColor as keyof typeof colorMap] || "bg-red-600";
  const statusColor = getBossStatusColor(boss);
  const isActive = !boss.isAlive && timeLeft > 0;

  return (
    <div
      className={cn(
        "rounded-lg p-4 border transition-all duration-300",
        isActive ? "cyber-border timer-active" : "border-border",
        className,
      )}
      data-testid={`boss-timer-${boss.id}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          {/* Avatar do boss */}
          <Avatar className="size-12 rounded-md bg-card border-2 border-primary/30">
            <AvatarImage
              src={boss.imageUrl || ""}
              alt={boss.name}
              className="h-full w-full object-contain p-1"
            />
            <AvatarFallback
              className={cn(
                "h-full w-full rounded-md flex items-center justify-center text-white",
                iconColorClass,
              )}
            >
              <Icon size={16} />
            </AvatarFallback>
          </Avatar>

          <div>
            <span className="font-medium" data-testid={`boss-name-${boss.id}`}>
              {boss.name}
            </span>
            <p className="text-xs text-muted-foreground">{boss.location}</p>
            {!boss.isAlive && boss.lastKilledBy && (
              <p className="text-xs text-yellow-400">Killed by: {boss.lastKilledBy}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!boss.isAlive && onRevive && (
            <button
              onClick={() => onRevive(boss.id)}
              className="p-1.5 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white transition-colors"
              title="Desfazer morte (clicou por engano)"
              data-testid={`boss-revive-${boss.id}`}
            >
              <RotateCcw size={12} />
            </button>
          )}

          <span
            className={cn(
              "text-sm px-2 py-1 rounded font-medium",
              boss.isAlive || timeLeft <= 0
                ? "bg-green-600 text-white"
                : "bg-destructive text-destructive-foreground",
            )}
            data-testid={`boss-status-${boss.id}`}
          >
            {boss.isAlive || timeLeft <= 0 ? "ALIVE" : "DEAD"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {boss.isAlive || timeLeft <= 0 ? "Status:" : "Respawn in:"}
        </span>

        <span
          className={cn(
            "font-bold",
            boss.isAlive || timeLeft <= 0
              ? "text-green-400"
              : `text-primary text-lg ${statusColor}`,
          )}
          data-testid={`boss-timer-display-${boss.id}`}
        >
          {boss.isAlive || timeLeft <= 0
            ? "Ready for hunt"
            : formatTimeRemaining(timeLeft)}
        </span>
      </div>

      {!boss.isAlive && timeLeft > 0 && (
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
            data-testid={`boss-progress-${boss.id}`}
          />
        </div>
      )}
    </div>
  );
}
