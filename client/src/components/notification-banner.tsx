import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  title: string;
  message: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

export function NotificationBanner() {
  const [isVisible, setIsVisible] = useState(true);

  const { data: notification } = useQuery<Notification | null>({
    queryKey: ["/api/notifications/active"],
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  // Reset visibility when notification changes
  useEffect(() => {
    if (notification) {
      setIsVisible(true);
    }
  }, [notification?.id]);

  // Don't render if no notification or user dismissed it
  if (!notification || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg rounded-2xl"
        data-testid="notification-banner"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-2">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg" data-testid="notification-title">
                  {notification.title}
                </h3>
                <p className="text-sm opacity-90" data-testid="notification-message">
                  {notification.message}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-white hover:bg-white/20 rounded-full p-2"
              data-testid="button-dismiss-notification"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}