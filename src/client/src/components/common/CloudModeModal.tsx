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
            <Cloud className="h-6 w-6 text-blue-500" />
            <DialogTitle className={isDarkMode ? "text-neutral-100" : "text-neutral-900"}>
              Cloud Mode Is Not Real
            </DialogTitle>
          </div>
          <DialogDescription className={isDarkMode ? "text-neutral-400" : "text-neutral-600"}>
            Mindpilot doens't have a cloud option yet. Click yes if you would you like a cloud mode for saving diagrams and sharing with your team?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleNo}
            className={isDarkMode
              ? "border-neutral-600 hover:bg-neutral-700 text-neutral-300"
              : "border-neutral-300 hover:bg-neutral-100"
            }
          >
            No
          </Button>
          <Button
            onClick={handleYes}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
