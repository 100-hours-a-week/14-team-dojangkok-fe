interface TextFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
}

export default function TextFieldModal({
  isOpen,
  onClose,
  onSubmit,
}: TextFieldModalProps) {
  if (!isOpen) return null;

  return <div>TextFieldModal</div>;
}
