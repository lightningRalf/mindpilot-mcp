import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cloud } from "lucide-react";
import { useAnalytics } from "@/hooks";

interface CloudModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export function CloudModeModal({ isOpen, onClose, isDarkMode }: CloudModeModalProps) {
  const { trackEvent } = useAnalytics();

  const handleYes = () => {
    trackEvent('cloud_mode_interest', { response: 'yes' });
    onClose();
  };

  const handleNo = () => {
    trackEvent('cloud_mode_interest', { response: 'no' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Cloud className={isDarkMode ? "h-6 w-6 text-orange-400" : "h-6 w-6 text-orange-500"} />
            <DialogTitle className={isDarkMode ? "text-neutral-100" : "text-neutral-900"}>
              Team Mode Doesn't Exist
            </DialogTitle>
          </div>
          <DialogDescription className={isDarkMode ? "text-neutral-400" : "text-neutral-600"}>
            Should it?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button
            variant="ghost"
            onClick={handleNo}
            className={isDarkMode
              ? "hover:bg-neutral-700 hover:text-neutral-100"
              : "hover:bg-neutral-100 hover:text-neutral-900"
            }
          >
            No
          </Button>
          <Button
            onClick={handleYes}
            className={isDarkMode
              ? "bg-orange-600 hover:bg-orange-700 text-white"
              : "bg-orange-500 hover:bg-orange-600 text-white"
            }
          >
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
