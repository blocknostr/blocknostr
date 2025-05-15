
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import SendTransactionForm from "./SendTransactionForm";

interface SendTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fixedAmount?: number;
}

const SendTransactionModal = ({ isOpen, onClose, fixedAmount }: SendTransactionModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <SendTransactionForm onCancel={onClose} fixedAmount={fixedAmount} />
      </DialogContent>
    </Dialog>
  );
};

export default SendTransactionModal;
