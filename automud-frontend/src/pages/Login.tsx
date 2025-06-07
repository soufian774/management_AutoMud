import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { testAuth } from '@/lib/api';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const navigate = useNavigate();
  
  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const success = await testAuth(formData.username, formData.password);

      if (success) {
        // Salva credenziali per future richieste
        const credentials = btoa(`${formData.username}:${formData.password}`);
        localStorage.setItem('automud_auth', credentials);
        
        navigate("/dashboard");
      } else {
        setError('Credenziali non valide. Riprova.');
      }
    } catch (err) {
      setError('Errore di connessione. Verifica la tua connessione internet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Header Section - Mobile Responsive */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Logo AutoMud - Mobile Responsive */}
              <div className="flex items-center gap-1">
                <div className="w-1 h-6 sm:h-8 bg-orange-400 rounded-full"></div>
                <div className="w-1 h-6 sm:h-8 bg-orange-400 rounded-full"></div>
              </div>
              <span className="text-2xl sm:text-4xl font-black text-white tracking-tight">AUTOMUD</span>
            </div>
          </div>
          <p className="text-slate-300 font-medium text-sm sm:text-base">Gestionale Aziendale</p>
        </div>

        {/* Login Card - Mobile Optimized */}
        <Card className="shadow-2xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl font-semibold text-white">
              Accedi
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2 text-sm">
              Inserisci le tue credenziali per accedere
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Username Field - Mobile Responsive */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-slate-200">
                Nome Utente
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Inserisci il nome utente"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="pl-10 h-11 sm:h-12 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-orange-400 focus:ring-orange-400/20 transition-colors text-base"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field - Mobile Responsive */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-200">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Inserisci la password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 h-11 sm:h-12 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-orange-400 focus:ring-orange-400/20 transition-colors text-base"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 sm:top-3.5 h-4 w-4 text-slate-400 hover:text-slate-200 transition-colors touch-manipulation"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Error Alert - Mobile Responsive */}
            {error && (
              <Alert className="border-red-500/50 bg-red-900/30 backdrop-blur-sm">
                <AlertDescription className="text-red-300 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Login Button - Mobile Optimized */}
            <Button
              type="button"
              onClick={handleSubmit}
              className="w-full h-11 sm:h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 text-base touch-manipulation"
              disabled={isLoading || !formData.username || !formData.password}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Accesso in corso...
                </div>
              ) : (
                'Accedi'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Footer - Mobile Responsive */}
        <div className="text-center mt-6 sm:mt-8">
          <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm text-slate-400 font-medium">Sistema Operativo</span>
          </div>
          <p className="text-xs text-slate-500">© 2025 AutoMud. Tutti i diritti riservati.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;