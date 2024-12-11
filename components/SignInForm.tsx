'use client';

import React from "react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DotPattern } from "@/components/ui/dot-pattern";

interface SignInFormProps {
  onSignIn: () => void;
}

const SignInForm: React.FC<SignInFormProps> = ({ onSignIn }) => {
  const [error, setError] = React.useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      await onSignIn();
    } catch (err) {
      setError("Failed to sign in. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md space-y-8 rounded-xl bg-white/10 p-8 backdrop-blur-md shadow-xl"
      >
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-6 text-3xl font-extrabold text-gray-900"
          >
            Welcome to Nuggt
          </motion.h2>
          <p className="mt-2 text-md text-gray-700">
            Sign in with Google to continue
          </p>
        </div>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center space-x-2 py-6 bg-black text-white hover:bg-gray-800 transition-colors duration-300"
          >
            <FcGoogle className="w-6 h-6" />
            <span>Sign in with Google</span>
          </Button>
        </motion.div>
      </motion.div>
      <DotPattern
        className={cn(
          "absolute inset-0 h-full w-full",
          "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
        )}
      />
    </div>
  );
};

export default SignInForm;
