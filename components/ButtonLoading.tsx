// components/ButtonLoading.tsx
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ButtonLoading() {
  return (
    <Button disabled>
      <Loader2 className="animate-spin mr-2" />
      Please wait
    </Button>
  );
}
