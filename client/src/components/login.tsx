import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface LoginProps {
  onShowRegister?: () => void;
}

export default function Login({ onShowRegister }: LoginProps) {
  const { login } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, digite seu nick do jogo.",
        variant: "destructive",
      });
      return;
    }
    
    if (!password.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, digite sua senha pessoal.",
        variant: "destructive",
      });
      return;
    }
    
    const success = await login(nickname.trim(), password);
    
    if (success) {
      toast({
        title: "Login realizado!",
        description: `Bem-vindo(a), ${nickname}! Não esqueça de dar a contribuição obrigatória.`,
      });
    } else {
      toast({
        title: "Erro no login",
        description: "Credenciais incorretas! Verifique seu nome e senha.",
        variant: "destructive",
      });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'url("/attached_assets/bg_story_01_1757081482180.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      color: '#ffffff',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        inset: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1
      }}></div>
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%)',
        padding: '2rem',
        borderRadius: '10px',
        border: '2px solid #ffd700',
        boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        zIndex: 2,
        backdropFilter: 'blur(5px)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#1a1a1a',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            border: '2px solid #ffd700'
          }}>
            <img 
              src="/attached_assets/command-seal-generator-v0-e1dspn4ztp8e1_1757098767587.jpg" 
              alt="Legion Symbol" 
              style={{
                width: '48px',
                height: '48px',
                objectFit: 'contain'
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<span style="color: #ffd700; font-weight: bold; font-size: 18px;">⚔️</span>';
                }
              }}
            />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
            Legion Timer TGG14
          </h1>
          <p style={{ color: '#888', margin: 0 }}>
            Sistema de Controle de Boss
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Seu Nick no Jogo
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Digite seu nick do jogo"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '2px solid #333',
                borderRadius: '6px',
                background: '#1a1a1a',
                color: '#fff',
                boxSizing: 'border-box'
              }}
              data-testid="input-nickname"
            />
          </div>


          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Sua Senha Pessoal
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha pessoal"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '2px solid #333',
                borderRadius: '6px',
                background: '#1a1a1a',
                color: '#fff',
                boxSizing: 'border-box'
              }}
              data-testid="input-password"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button
              type="submit"
              style={{
                flex: '1',
                padding: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                background: '#ffd700',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#ffed4e';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#ffd700';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              data-testid="button-login"
            >
              Entrar
            </button>
            
            <button
              type="button"
              onClick={onShowRegister}
              style={{
                flex: '1',
                padding: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                background: 'transparent',
                color: '#ffd700',
                border: '2px solid #ffd700',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#ffd700';
                e.currentTarget.style.color = '#000';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#ffd700';
              }}
              data-testid="button-register"
            >
              Cadastrar
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>
            Acesso restrito aos membros da legião
          </p>
        </div>
      </div>
    </div>
  );
}