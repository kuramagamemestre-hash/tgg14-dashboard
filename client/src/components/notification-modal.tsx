import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Send } from "lucide-react";

interface NotificationData {
  title: string;
  message: string;
  createdBy: string;
  isActive: boolean;
}

export function NotificationModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentMember, hasAdminAccess } = useAuth();

  // Only show for leaders and admins
  if (!hasAdminAccess || !currentMember) {
    return null;
  }

  const createNotificationMutation = useMutation({
    mutationFn: async (data: NotificationData) => {
      const response = await apiRequest("POST", "/api/notifications", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/active"] });
      toast({
        title: "Notificação Enviada",
        description: "A notificação foi enviada para todos os membros.",
      });
      setTitle("");
      setMessage("");
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar notificação",
        variant: "destructive",
      });
    },
  });

  const clearNotificationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/notifications");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/active"] });
      toast({
        title: "Notificação Removida",
        description: "A notificação foi removida da tela.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao remover notificação",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Erro",
        description: "Título e mensagem são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    createNotificationMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      createdBy: currentMember.id,
      isActive: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center space-x-2"
          data-testid="button-open-notification-modal"
        >
          <Bell className="w-5 h-5" />
          <span>Notificar Membros</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" data-testid="notification-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-purple-400" />
            <span>Enviar Notificação</span>
          </DialogTitle>
          <DialogDescription>
            Envie uma mensagem que aparecerá no topo da tela para todos os membros. 
            A notificação anterior será substituída.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião de Guerra"
              maxLength={100}
              data-testid="input-notification-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: Guerra acontecerá hoje às 20h. Todos devem estar online!"
              maxLength={500}
              rows={4}
              data-testid="textarea-notification-message"
            />
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={() => clearNotificationMutation.mutate()}
              disabled={clearNotificationMutation.isPending}
              data-testid="button-clear-notification"
            >
              Remover Atual
            </Button>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel-notification"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createNotificationMutation.isPending}
                data-testid="button-send-notification"
              >
                <Send className="w-4 h-4 mr-2" />
                {createNotificationMutation.isPending ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}