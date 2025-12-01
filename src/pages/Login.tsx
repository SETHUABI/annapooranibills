import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, isAuthenticated } from '@/lib/auth';
import { initializeDefaultData } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if already logged in
    if (isAuthenticated()) {
      navigate('/dashboard');
      return;
    }

    // Initialize database
    initializeDefaultData()
      .then(() => {
        setIsInitializing(false);
      })
      .catch((error) => {
        console.error('Failed to initialize database:', error);
        toast({
          title: 'Initialization Error',
          description: 'Failed to initialize the application. Please refresh the page.',
          variant: 'destructive',
        });
      });
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both username and password',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const user = await login(username, password);
      
      if (user) {
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${user.name}!`,
        });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Login Failed',
          description: 'Invalid username or password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during login. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/20 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 animate-fade-in">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logo} alt="Restaurant POS" className="w-20 h-20" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">Restaurant POS</CardTitle>
            <CardDescription className="text-base mt-2">
              Sign in to access your point of sale system
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="h-12"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-12"
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-semibold mb-2">Demo Credentials:</p>
            <p className="text-xs text-muted-foreground">
              Username: <span className="font-mono font-semibold text-foreground">admin</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Password: <span className="font-mono font-semibold text-foreground">admin123</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
