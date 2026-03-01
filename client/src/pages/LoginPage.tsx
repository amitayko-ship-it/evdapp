import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import Footer from "../components/layout/Footer";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const { login, isLoggingIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      await login(email.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-brand-yellow/5 via-white to-brand-green/5">
      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-stone-lg p-8 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/logo-even-derech.png" alt="אבן דרך" className="h-20 object-contain" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">כתובת אימייל</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow text-left bg-white transition-shadow"
                dir="ltr"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-brand-yellow text-foreground rounded-full font-semibold hover:bg-brand-yellow/90 transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
            >
              {isLoggingIn ? "מתחבר..." : "כניסה"}
            </button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-6">
            הזן את כתובת האימייל שלך להתחברות
          </p>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
