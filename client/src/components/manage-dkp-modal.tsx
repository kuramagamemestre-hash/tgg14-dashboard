import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus } from "lucide-react";

interface ManageDkpModalProps {
  open: boolean;
  onClose: () => void;
  member: any;
}

export default function ManageDkpModal({ open, onClose, member }: ManageDkpModalProps) {
  const [dkpAmount, setDkpAmount] = useState(0);
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateDkpMutation = useMutation({
    mutationFn: async ({ memberId, newDkp, reason }: { memberId: string; newDkp: number; reason: string }) => {
      const response = await apiRequest("PUT", `/api/members/${memberId}`, { 
        dkp: newDkp,
        // Vamos registrar a atividade também
      });
      
      // Registrar atividade de DKP
      await apiRequest("POST", "/api/activities", {
        type: "dkp_change",
        description: reason || `DKP alterado para ${newDkp} pontos`,
        memberId: memberId,
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "DKP Atualizado",
        description: `DKP de ${member.name} foi atualizado com sucesso.`,
      });
      onClose();
      setDkpAmount(0);
      setReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar DKP",
        variant: "destructive",
      });
    },
  });

  const handleAddDkp = () => {
    if (dkpAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor positivo para adicionar DKP.",
        variant: "destructive",
      });
      return;
    }

    const currentDkp = member.dkp || 0;
    const newDkp = currentDkp + dkpAmount;
    updateDkpMutation.mutate({
      memberId: member.id,
      newDkp,
      reason: reason || `Adicionado ${dkpAmount} DKP (${currentDkp} + ${dkpAmount} = ${newDkp})`,
    });
  };

  const handleRemoveDkp = () => {
    if (dkpAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor positivo para remover DKP.",
        variant: "destructive",
      });
      return;
    }

    const currentDkp = member.dkp || 0;
    const newDkp = Math.max(0, currentDkp - dkpAmount);
    const actualRemoved = currentDkp - newDkp;
    updateDkpMutation.mutate({
      memberId: member.id,
      newDkp,
      reason: reason || `Removido ${actualRemoved} DKP (${currentDkp} - ${actualRemoved} = ${newDkp})`,
    });
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white text-center">
            Gerenciar DKP - {member.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8">
          <div className="text-center p-6 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-2xl border border-yellow-400/30">
            <p className="text-white/70 text-sm font-medium mb-2">DKP Atual</p>
            <p className="text-4xl font-bold text-yellow-400">{member.dkp || 0}</p>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-white font-medium mb-2 block">Quantidade de DKP</Label>
              <Input
                type="number"
                min="0"
                value={dkpAmount}
                onChange={(e) => setDkpAmount(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="bg-white/10 border-white/20 text-white placeholder-white/50 rounded-xl p-4 text-lg font-medium"
                data-testid="input-dkp-amount"
              />
            </div>

            <div>
              <Label className="text-white font-medium mb-2 block">Motivo (opcional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Participação em raid, contribuição para guilda..."
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder-white/50 rounded-xl p-4 resize-none"
                data-testid="input-dkp-reason"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <Button 
              onClick={handleAddDkp} 
              disabled={updateDkpMutation.isPending || dkpAmount <= 0}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
              data-testid="button-add-dkp"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar {dkpAmount} DKP {dkpAmount > 0 && `(${member.dkp || 0} + ${dkpAmount} = ${(member.dkp || 0) + dkpAmount})`}
            </Button>
            
            <Button 
              onClick={handleRemoveDkp} 
              disabled={updateDkpMutation.isPending || dkpAmount <= 0}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-4 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
              data-testid="button-remove-dkp"
            >
              <Minus className="w-5 h-5 mr-2" />
              Remover {dkpAmount} DKP {dkpAmount > 0 && `(${member.dkp || 0} - ${dkpAmount} = ${Math.max(0, (member.dkp || 0) - dkpAmount)})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}