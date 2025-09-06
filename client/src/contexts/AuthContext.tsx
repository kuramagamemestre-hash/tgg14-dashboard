import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isLeader: boolean;
  isSystemAdmin: boolean;
  currentMember: any;
  login: (name: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasAdminAccess: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLeader, setIsLeader] = useState(false);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar se há sessão ativa no localStorage
  useEffect(() => {
    const savedAuth = localStorage.getItem("legion-auth");
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        setIsLeader(authData.isLeader || false);
        setIsSystemAdmin(authData.isAdmin || false);
        setCurrentMember(authData.member || null);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem("legion-auth");
      }
    }
  }, []);

  const login = async (name: string, password?: string): Promise<boolean> => {
    // Agora todos os membros precisam de senha pessoal
    if (!password) {
      return false; // Senha é obrigatória para todos
    }

    try {
      // Fazer requisição para o endpoint de login
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, password }),
      });

      if (response.ok) {
        const member = await response.json();
        
        // KURAMA é admin do sistema - tem privilégios especiais mas não é líder da legião
        const isKurama = member.name === "KURAMA";
        const isLeader = !isKurama && (member.role === "LEADER" || member.role === "Líder" || member.role === "Vice Líder" || member.role === "Líder Master");
        const isAdmin = isKurama && (member.role === "ADMIN" || member.role === "ADM SISTEMA");
        
        setIsLeader(isLeader);
        setIsSystemAdmin(isAdmin);
        setCurrentMember(member);
        setIsAuthenticated(true);
        
        localStorage.setItem("legion-auth", JSON.stringify({
          isLeader: isLeader,
          isAdmin: isAdmin,
          member: member
        }));
        
        return true;
      } else {
        return false; // Credenciais inválidas
      }
    } catch (error) {
      console.error("Erro no login:", error);
      return false;
    }
  };

  const logout = () => {
    setIsLeader(false);
    setIsSystemAdmin(false);
    setCurrentMember(null);
    setIsAuthenticated(false);
    localStorage.removeItem("legion-auth");
  };

  const hasAdminAccess = isLeader || isSystemAdmin;

  const value: AuthContextType = {
    isLeader,
    isSystemAdmin,
    currentMember,
    login,
    logout,
    isAuthenticated,
    hasAdminAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}