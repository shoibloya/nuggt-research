'use client';

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";

export default function SignInForm() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md space-y-8"
    >
      <div className="text-center">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-6 text-3xl font-extrabold text-gray-900"
        >
          Sign in to your account
        </motion.h2>
        <p className="mt-2 text-sm text-gray-600">
          Use your Google account to continue
        </p>
      </div>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full flex items-center justify-center space-x-2 py-6"
        >
          <FcGoogle className="w-6 h-6" />
          <span>Sign in with Google</span>
        </Button>
      </motion.div>
    </motion.div>
  );
}

