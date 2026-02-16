import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const redirectTo = (location.state as { from?: string } | undefined)?.from || "/kabinet";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginValue && password) {
      try {
        setPending(true);
        await login(loginValue, password);
        navigate(redirectTo, { replace: true });
      } catch (error) {
        toast({
          title: "Kirish amalga oshmadi",
          description: error instanceof Error ? error.message : "Noma'lum xatolik",
          variant: "destructive",
        });
      } finally {
        setPending(false);
      }
    }
  };

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-8">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="mb-8 text-center">
            <Brain className="mx-auto mb-3 h-10 w-10 text-accent" />
            <h1 className="text-2xl font-bold">Tizimga kirish</h1>
            <p className="text-sm text-muted-foreground">Akkauntingiz ma'lumotlari bilan kiring</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Email yoki login</Label>
              <Input
                id="login"
                type="text"
                placeholder="email@example.com yoki adminmain"
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <Input id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>{pending ? "Kirilmoqda..." : "Kirish"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Akkauntingiz yo'qmi?{" "}
            <Link to="/royxat" className="text-accent hover:underline font-medium">Ro'yxatdan o'ting</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


