import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import viaxoLogo from "@/assets/viaxo-ai-logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate("/workspace");
    }
  };

  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <img src={viaxoLogo} alt="Kicker Ventures" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Login</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your workspace</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="text-white border-gray-600 bg-gray-900 placeholder:text-gray-500"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="text-white border-gray-600 bg-gray-900 placeholder:text-gray-500"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>
        <div className="text-center">
          <button
            onClick={() => navigate("/")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to site
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
